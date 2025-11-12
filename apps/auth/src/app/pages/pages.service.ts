import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePageDto) {
    try {
      return await this.prisma.page.create({
        data: this.mapDtoToData(dto),
        include: {
          roles: {
            include: {
              userType: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async findAll() {
    return this.prisma.page.findMany({
      orderBy: { name: 'asc' },
      include: {
        roles: {
          include: { userType: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        roles: {
          include: { userType: { select: { id: true, name: true } } },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Página não encontrada.');
    }

    return page;
  }

  async update(id: string, dto: UpdatePageDto) {
    await this.ensureExists(id);

    try {
      return await this.prisma.page.update({
        where: { id },
        data: this.mapDtoToData(dto),
        include: {
          roles: {
            include: { userType: { select: { id: true, name: true } } },
          },
        },
      });
    } catch (error) {
      this.handleKnownErrors(error);
    }
  }

  async remove(id: string) {
    await this.ensureExists(id);

    return this.prisma.page.delete({
      where: { id },
      include: {
        roles: {
          include: { userType: { select: { id: true, name: true } } },
        },
      },
    });
  }

  private mapDtoToData(dto: CreatePageDto | UpdatePageDto): Prisma.PageUncheckedCreateInput | Prisma.PageUncheckedUpdateInput {
    const data: Prisma.PageUncheckedCreateInput & Prisma.PageUncheckedUpdateInput =
      {} as Prisma.PageUncheckedCreateInput & Prisma.PageUncheckedUpdateInput;

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
      throw new NotFoundException('Página não encontrada.');
    }
  }

  private handleKnownErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('Já existe uma página com esta chave.');
      }
    }

    throw error;
  }
}
