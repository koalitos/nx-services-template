import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    roles: {
      include: {
        userType: {
          select: { id: true, name: true },
        },
      },
    },
  } satisfies Prisma.PageInclude;

  async create(dto: CreatePageDto) {
    try {
      return await this.prisma.page.create({
        data: this.mapCreateData(dto),
        include: this.defaultInclude,
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async findAll() {
    return this.prisma.page.findMany({
      orderBy: { name: 'asc' },
      include: this.defaultInclude,
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!page) {
      throw new NotFoundException('Pagina nao encontrada.');
    }

    return page;
  }

  async update(id: string, dto: UpdatePageDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.page.update({
        where: { id },
        data: this.mapUpdateData(dto),
        include: this.defaultInclude,
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.page.delete({
      where: { id },
      include: this.defaultInclude,
    });
  }

  private mapCreateData(dto: CreatePageDto): Prisma.PageUncheckedCreateInput {
    return {
      key: dto.key.trim(),
      name: dto.name.trim(),
      path: dto.path?.trim() ?? null,
      description: dto.description?.trim() ?? null,
      isActive: dto.isActive ?? true,
    };
  }

  private mapUpdateData(dto: UpdatePageDto): Prisma.PageUncheckedUpdateInput {
    const data: Prisma.PageUncheckedUpdateInput = {};

    if (dto.key !== undefined) {
      data.key = dto.key.trim();
    }

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }

    if (dto.path !== undefined) {
      data.path = dto.path?.trim() ?? null;
    }

    if (dto.description !== undefined) {
      data.description = dto.description?.trim() ?? null;
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    return data;
  }

  private async ensureExists(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!page) {
      throw new NotFoundException('Pagina nao encontrada.');
    }
  }

  private handleKnownErrors(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ja existe uma pagina com esta chave.');
    }

    throw error;
  }
}
