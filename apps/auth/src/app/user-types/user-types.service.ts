import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserTypeDto } from './dto/create-user-type.dto';
import { UpdateUserTypeDto } from './dto/update-user-type.dto';

@Injectable()
export class UserTypesService {
  constructor(private readonly prisma: PrismaService) {}

  private userTypeInclude() {
    return {
      userGroup: true,
      pageRoles: {
        include: {
          page: true,
        },
      },
    };
  }

  async create(dto: CreateUserTypeDto) {
    if (dto.userGroupId) {
      await this.ensureGroupExists(dto.userGroupId);
    }

    try {
      return await this.prisma.userType.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim(),
          isActive: dto.isActive ?? true,
          userGroupId: dto.userGroupId ?? null,
        },
        include: this.userTypeInclude(),
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async findAll() {
    return this.prisma.userType.findMany({
      orderBy: { name: 'asc' },
      include: this.userTypeInclude(),
    });
  }

  async findOne(id: string) {
    const userType = await this.prisma.userType.findUnique({
      where: { id },
      include: this.userTypeInclude(),
    });

    if (!userType) {
      throw new NotFoundException('Tipo de usuario nao encontrado.');
    }

    return userType;
  }

  async update(id: string, dto: UpdateUserTypeDto) {
    await this.ensureExists(id);

    if (dto.userGroupId) {
      await this.ensureGroupExists(dto.userGroupId);
    }

    try {
      const data: Prisma.UserTypeUncheckedUpdateInput = {};

      if (dto.name !== undefined) {
        data.name = dto.name.trim();
      }

      if (dto.description !== undefined) {
        data.description = dto.description?.trim() ?? null;
      }

      if (dto.isActive !== undefined) {
        data.isActive = dto.isActive;
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'userGroupId')) {
        data.userGroupId = dto.userGroupId ?? null;
      }

      return await this.prisma.userType.update({
        where: { id },
        data,
        include: this.userTypeInclude(),
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.userType.delete({
      where: { id },
      include: this.userTypeInclude(),
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.userType.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Tipo de usuario nao encontrado.');
    }
  }

  private async ensureGroupExists(userGroupId: string) {
    const group = await this.prisma.userGroup.findUnique({
      where: { id: userGroupId },
      select: { id: true },
    });

    if (!group) {
      throw new NotFoundException('Grupo informado nao existe.');
    }
  }

  private handleKnownErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ja existe um tipo com este nome para o grupo informado.');
      }
    }

    throw error;
  }
}
