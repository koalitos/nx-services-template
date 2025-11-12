import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../supabase/guards/supabase-auth.guard';
import { SupabaseUser } from '../supabase/decorators/supabase-user.decorator';
import { SupabaseAuthUser } from '../supabase/interfaces/supabase-user.interface';
import { ChatService } from './chat.service';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';

@ApiTags('chat')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Cria uma sala de chat criptografada.' })
  @ApiCreatedResponse({ description: 'Sala criada com sucesso.' })
  createRoom(
    @SupabaseUser() user: SupabaseAuthUser | undefined,
    @Body() dto: CreateChatRoomDto
  ) {
    return this.chatService.createRoom(this.ensureUser(user), dto);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Lista as salas em que o usuario participa.' })
  @ApiOkResponse({ description: 'Salas retornadas com sucesso.' })
  listRooms(@SupabaseUser() user: SupabaseAuthUser | undefined) {
    const currentUser = this.ensureUser(user);
    return this.chatService.listRooms(currentUser.id);
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Envia uma mensagem criptografada para a sala.' })
  @ApiCreatedResponse({ description: 'Mensagem enviada.' })
  sendMessage(
    @SupabaseUser() user: SupabaseAuthUser | undefined,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Body() dto: SendMessageDto
  ) {
    return this.chatService.sendMessage(roomId, this.ensureUser(user), dto);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Recupera o historico descriptografado da sala.' })
  @ApiOkResponse({ description: 'Mensagens retornadas.' })
  getMessages(
    @SupabaseUser() user: SupabaseAuthUser | undefined,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Query() query: ListMessagesDto
  ) {
    return this.chatService.getMessages(roomId, this.ensureUser(user), query);
  }

  private ensureUser(user?: SupabaseAuthUser): SupabaseAuthUser {
    if (!user) {
      throw new UnauthorizedException('Usuario Supabase nao encontrado no contexto.');
    }

    return user;
  }
}
