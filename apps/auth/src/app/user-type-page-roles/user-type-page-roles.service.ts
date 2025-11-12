import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserTypePageRoleDto } from './dto/create-user-type-page-role.dto';
import { UpdateUserTypePageRoleDto } from './dto/update-user-type-page-role.dto';

@Injectable()
export class UserTypePageRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserTypePageRoleDto) {
    await this.ensureRelations(dto.userTypeId, dto.pageId);

    try {
      return await this.prisma.userTypePageRole.create({
        data: {
          userTypeId: dto.userTypeId,
          pageId: dto.pageId,
          role: dto.role.trim(),
        },
        include: this.defaultInclude(),
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async findAll(filters: { userTypeId?: string; pageId?: string } = {}) {
    return this.prisma.userTypePageRole.findMany({
      where: {
        userTypeId: filters.userTypeId,
        pageId: filters.pageId,
      },
      orderBy: [{ userType: { name: 'asc' } }, { page: { name: 'asc' } }],
      include: this.defaultInclude(),
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.userTypePageRole.findUnique({
      where: { id },
      include: this.defaultInclude(),
    });

    if (!role) {
      throw new NotFoundException('Regra de página não encontrada.');
    }

    return role;
  }

  async update(id: string, dto: UpdateUserTypePageRoleDto) {
    const existing = await this.ensureExists(id);
    const userTypeId = dto.userTypeId ?? existing.userTypeId;
    const pageId = dto.pageId ?? existing.pageId;

    if (dto.userTypeId || dto.pageId) {
      await this.ensureRelations(userTypeId, pageId);
    }

    try {
      return await this.prisma.userTypePageRole.update({
        where: { id },
        data: {
          userTypeId,
          pageId,
          role: dto.role?.trim(),
        },
        include: this.defaultInclude(),
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.userTypePageRole.delete({
      where: { id },
      include: this.defaultInclude(),
    });
  }

  private defaultInclude() {
    return {
      userType: {
        select: {
          id: true,
          name: true,
          userGroup: { select: { id: true, name: true } },
        },
      },
      page: {
        select: {
          id: true,
          key: true,
          name: true,
          path: true,
        },
      },
    };
  }

  private async ensureExists(id: string) {
    const role = await this.prisma.userTypePageRole.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Regra de página não encontrada.');
    }

    return role;
  }

  private async ensureRelations(userTypeId: string, pageId: string) {
    const [userType, page] = await Promise.all([
      this.prisma.userType.findUnique({ where: { id: userTypeId }, select: { id: true } }),
      this.prisma.page.findUnique({ where: { id: pageId }, select: { id: true } }),
    ]);

    if (!userType) {
      throw new NotFoundException('Tipo de usuário informado não existe.');
    }

    if (!page) {
      throw new NotFoundException('Página informada não existe.');
    }
  }

  private handleKnownErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Este tipo já possui uma role configurada para a página informada.');
      }
    }

    throw error;
  }
}
