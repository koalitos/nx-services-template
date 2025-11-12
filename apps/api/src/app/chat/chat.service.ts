import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseAuthUser } from '../supabase/interfaces/supabase-user.interface';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { ChatEncryptionService } from './chat-encryption.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SupabaseRealtimeService } from '../supabase/supabase-realtime.service';
import { ListMessagesDto } from './dto/list-messages.dto';

type ChatMessageRecord = {
  id: string;
  chatRoomId: string;
  senderUserId: string;
  ciphertext: string;
  iv: string;
  authTag: string;
  createdAt: Date;
};

type RoomWithRelations = Prisma.ChatRoomGetPayload<{
  include: {
    participants: {
      include: {
        profile: {
          select: {
            handle: true;
            displayName: true;
          };
        };
      };
    };
    messages: true;
  };
}>;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: ChatEncryptionService,
    private readonly realtime: SupabaseRealtimeService
  ) {}

  private readonly roomRelations = {
    participants: {
      include: {
        profile: {
          select: {
            handle: true,
            displayName: true,
          },
        },
      },
    },
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
  } satisfies Prisma.ChatRoomInclude;

  async createRoom(user: SupabaseAuthUser, dto: CreateChatRoomDto) {
    const participantSet = new Set<string>([user.id, ...dto.participantIds]);

    if (participantSet.size < 2) {
      throw new BadRequestException('Uma sala precisa de pelo menos dois participantes.');
    }

    const room = (await this.prisma.chatRoom.create({
      data: {
        name: dto.name.trim(),
        type: 'GROUP',
        participants: {
          create: Array.from(participantSet).map((participantId) => ({
            supabaseUserId: participantId,
          })),
        },
      },
      include: this.roomRelations,
    })) as RoomWithRelations;

    return this.mapRoom(room);
  }

  async listRooms(userId: string) {
    const rooms = (await this.prisma.chatRoom.findMany({
      where: {
        participants: {
          some: { supabaseUserId: userId },
        },
      },
      include: this.roomRelations,
      orderBy: { updatedAt: 'desc' },
    })) as RoomWithRelations[];

    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((participant) => ({
        id: participant.id,
        supabaseUserId: participant.supabaseUserId,
        joinedAt: participant.joinedAt,
      })),
      lastMessage:
        room.messages.length > 0 ? this.mapMessage(room.messages[0]) : null,
    }));
  }

  async startDirectChat(user: SupabaseAuthUser, handle: string) {
    const room = await this.getOrCreateDirectRoom(user, handle, true);

    if (!room) {
      throw new NotFoundException('Falha ao criar conversa direta.');
    }

    return this.mapRoom(room);
  }

  async sendDirectMessage(user: SupabaseAuthUser, handle: string, dto: SendMessageDto) {
    const room = await this.getOrCreateDirectRoom(user, handle, true);
    if (!room) {
      throw new NotFoundException('Falha ao criar conversa direta.');
    }
    return this.sendMessage(room.id, user, dto);
  }

  async getDirectMessages(user: SupabaseAuthUser, handle: string, dto: ListMessagesDto) {
    const room = await this.getOrCreateDirectRoom(user, handle, false);

    if (!room) {
      throw new NotFoundException('Conversa direta nao encontrada.');
    }

    return this.getMessages(room.id, user, dto);
  }

  async sendMessage(roomId: string, user: SupabaseAuthUser, dto: SendMessageDto) {
    const participant = await this.ensureParticipant(roomId, user.id);
    const encrypted = this.encryption.encrypt(dto.content);

    const message = await this.prisma.chatMessage.create({
      data: {
        chatRoomId: roomId,
        senderParticipantId: participant.id,
        senderUserId: user.id,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      },
    });

    const response = this.mapMessage(message);

    await this.realtime.broadcast({
      channel: this.roomChannel(roomId),
      event: 'chat.message',
      payload: response,
    });

    return response;
  }

  async getMessages(roomId: string, user: SupabaseAuthUser, dto: ListMessagesDto) {
    await this.ensureParticipant(roomId, user.id);

    const take = dto.limit ?? 50;

    const messages = await this.prisma.chatMessage.findMany({
      where: { chatRoomId: roomId },
      orderBy: { createdAt: 'desc' },
      take,
      ...(dto.cursor
        ? {
            cursor: { id: dto.cursor },
            skip: 1,
          }
        : {}),
    });

    return messages.reverse().map((message) => this.mapMessage(message));
  }

  private mapRoom(room: RoomWithRelations) {
    return {
      id: room.id,
      name: room.name,
      type: room.type,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((participant) => ({
        id: participant.id,
        supabaseUserId: participant.supabaseUserId,
        handle: participant.profile?.handle ?? null,
        displayName: participant.profile?.displayName ?? null,
        joinedAt: participant.joinedAt,
      })),
      lastMessage:
        room.messages.length > 0 ? this.mapMessage(room.messages[0]) : null,
    };
  }

  private mapMessage(message: ChatMessageRecord) {
    const plaintext = this.encryption.decrypt({
      ciphertext: message.ciphertext,
      iv: message.iv,
      authTag: message.authTag,
    });

    return {
      id: message.id,
      roomId: message.chatRoomId,
      senderUserId: message.senderUserId,
      content: plaintext,
      createdAt: message.createdAt,
    };
  }

  private async ensureParticipant(roomId: string, userId: string) {
    const participant = await this.prisma.chatParticipant.findFirst({
      where: { chatRoomId: roomId, supabaseUserId: userId },
    });

    if (!participant) {
      const roomExists = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        select: { id: true },
      });

      if (!roomExists) {
        throw new NotFoundException('Sala de chat nao encontrada.');
      }

      throw new ForbiddenException('Usuario nao participa desta sala.');
    }

    return participant;
  }

  private roomChannel(roomId: string) {
    return `chat.room.${roomId}`;
  }

  private async getOrCreateDirectRoom(
    user: SupabaseAuthUser,
    handle: string,
    createIfMissing: boolean
  ) {
    const normalizedHandle = handle.trim().toLowerCase();

    const targetProfile = await this.prisma.profile.findUnique({
      where: { handle: normalizedHandle },
      select: { supabaseUserId: true, handle: true, displayName: true },
    });

    if (!targetProfile) {
      throw new NotFoundException('Usuario alvo nao encontrado.');
    }

    if (targetProfile.supabaseUserId === user.id) {
      throw new BadRequestException('Nao e possivel iniciar conversa consigo mesmo.');
    }

    const directKey = this.buildDirectKey(user.id, targetProfile.supabaseUserId);

    let room = (await this.prisma.chatRoom.findUnique({
      where: { directKey },
      include: this.roomRelations,
    })) as RoomWithRelations | null;

    if (!room && createIfMissing) {
      const currentProfile = await this.prisma.profile.findUnique({
        where: { supabaseUserId: user.id },
        select: { handle: true, displayName: true },
      });

      if (!currentProfile?.handle) {
        throw new NotFoundException('Perfil do usuario nao possui handle configurado.');
      }

      room = (await this.prisma.chatRoom.create({
        data: {
          name: this.buildDirectRoomName(currentProfile.handle, targetProfile.handle),
          type: 'DIRECT',
          directKey,
          participants: {
            create: [
              { supabaseUserId: user.id },
              { supabaseUserId: targetProfile.supabaseUserId },
            ],
          },
        },
        include: this.roomRelations,
      })) as RoomWithRelations;
    }

    return room ?? null;
  }

  private buildDirectKey(userA: string, userB: string) {
    return [userA, userB].sort().join('#');
  }

  private buildDirectRoomName(handleA: string, handleB: string) {
    return `Chat ${[handleA, handleB].sort().join(' & ')}`;
  }
}
