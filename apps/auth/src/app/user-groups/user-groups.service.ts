import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';

@Injectable()
export class UserGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserGroupDto) {
    try {
      return await this.prisma.userGroup.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim(),
          isActive: dto.isActive ?? true,
        },
        include: { userTypes: true },
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async findAll() {
    return this.prisma.userGroup.findMany({
      orderBy: { name: 'asc' },
      include: { userTypes: true },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.userGroup.findUnique({
      where: { id },
      include: { userTypes: true },
    });

    if (!group) {
      throw new NotFoundException('Grupo de usuário não encontrado.');
    }

    return group;
  }

  async update(id: string, dto: UpdateUserGroupDto) {
    await this.ensureExists(id);

    try {
      const data: Prisma.UserGroupUpdateInput = {};

      if (dto.name !== undefined) {
        data.name = dto.name.trim();
      }

      if (dto.description !== undefined) {
        data.description = dto.description?.trim() ?? null;
      }

      if (dto.isActive !== undefined) {
        data.isActive = dto.isActive;
      }

      return await this.prisma.userGroup.update({
        where: { id },
        data,
        include: { userTypes: true },
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.userGroup.delete({
      where: { id },
      include: { userTypes: true },
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.userGroup.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Grupo de usuário não encontrado.');
    }
  }

  private handleKnownErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Já existe um grupo com este nome.');
      }
    }

    throw error;
  }
}
