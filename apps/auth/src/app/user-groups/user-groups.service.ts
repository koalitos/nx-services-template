import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';

@Injectable()
export class UserGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private includeRelations() {
    return {
      userTypes: {
        include: {
          pageRoles: {
            include: {
              page: true,
            },
          },
        },
      },
    };
  }

  async create(dto: CreateUserGroupDto) {
    try {
      return await this.prisma.userGroup.create({
        data: {
          name: dto.name.trim(),
          description: dto.description?.trim(),
          isActive: dto.isActive ?? true,
        },
        include: this.includeRelations(),
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async findAll() {
    return this.prisma.userGroup.findMany({
      orderBy: { name: 'asc' },
      include: this.includeRelations(),
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.userGroup.findUnique({
      where: { id },
      include: this.includeRelations(),
    });

    if (!group) {
      throw new NotFoundException('Grupo de usuario nao encontrado.');
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
        include: this.includeRelations(),
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.userGroup.delete({
      where: { id },
      include: this.includeRelations(),
    });
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.userGroup.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Grupo de usuario nao encontrado.');
    }
  }

  private handleKnownErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ja existe um grupo com este nome.');
      }
    }

    throw error;
  }
}
