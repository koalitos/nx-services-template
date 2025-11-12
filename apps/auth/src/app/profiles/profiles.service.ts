import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileUserTypeDto } from './dto/update-profile-user-type.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  private profileInclude() {
    return {
      userType: {
        include: {
          userGroup: true,
          pageRoles: {
            include: { page: true },
          },
        },
      },
    };
  }

  async findAll() {
    return this.prisma.profile.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.profileInclude(),
    });
  }

  async findOne(supabaseUserId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
      include: this.profileInclude(),
    });

    if (!profile) {
      throw new NotFoundException('Perfil nao encontrado.');
    }

    return profile;
  }

  async updateUserType(supabaseUserId: string, dto: UpdateProfileUserTypeDto) {
    await this.ensureProfileExists(supabaseUserId);

    if (Object.prototype.hasOwnProperty.call(dto, 'userTypeId') && dto.userTypeId) {
      await this.ensureUserTypeExists(dto.userTypeId);
    }

    const data: Prisma.ProfileUncheckedUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(dto, 'userTypeId')) {
      data.userTypeId = dto.userTypeId ?? null;
    }

    return this.prisma.profile.update({
      where: { supabaseUserId },
      data,
      include: this.profileInclude(),
    });
  }

  private async ensureProfileExists(supabaseUserId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { supabaseUserId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Perfil nao encontrado.');
    }
  }

  private async ensureUserTypeExists(userTypeId: string) {
    const userType = await this.prisma.userType.findUnique({
      where: { id: userTypeId },
      select: { id: true },
    });

    if (!userType) {
      throw new NotFoundException('Tipo de usuario informado nao existe.');
    }
  }
}
