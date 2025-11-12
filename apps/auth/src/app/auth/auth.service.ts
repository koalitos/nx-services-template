import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

type ProfileWithAccess = Prisma.ProfileGetPayload<{
  include: {
    userType: {
      include: {
        userGroup: true;
        pageRoles: {
          include: { page: true };
        };
      };
    };
  };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService
  ) {}

  async register(dto: RegisterDto) {
    if (dto.userTypeId) {
      await this.ensureUserTypeExists(dto.userTypeId);
    }

    const client = this.supabaseService.getServiceRoleClient();
    const { data, error } = await client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        displayName: dto.displayName,
      },
    });

    if (error || !data?.user) {
      throw new InternalServerErrorException(
        `Erro ao criar usuario no Supabase: ${error?.message ?? 'desconhecido'}`
      );
    }

    await this.syncProfileFromSupabase(data.user, {
      displayName: dto.displayName,
      userTypeId: dto.userTypeId ?? null,
    });

    const profile = await this.fetchProfileWithAccess(data.user.id);

    return {
      message: 'Usuario criado com sucesso.',
      user: this.mapUser(data.user),
      profile: this.mapProfile(profile),
    };
  }

  async login(dto: LoginDto) {
    const client = this.supabaseService.getPublicClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(error?.message ?? 'Credenciais invalidas');
    }

    await this.syncProfileFromSupabase(data.user);
    const profile = await this.fetchProfileWithAccess(data.user.id);

    return {
      tokenType: 'bearer',
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: this.mapUser(data.user),
      profile: this.mapProfile(profile),
    };
  }

  private async syncProfileFromSupabase(
    user: User,
    options?: { displayName?: string | null; userTypeId?: string | null }
  ) {
    const displayName =
      options?.displayName ??
      (user.user_metadata?.displayName as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      null;

    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.avatarUrl as string | undefined) ??
      null;

    const existingProfile = await this.prisma.profile.findUnique({
      where: { supabaseUserId: user.id },
      select: { handle: true },
    });

    const handle =
      existingProfile?.handle ??
      (await this.generateUniqueHandle({
        displayName,
        email: user.email,
      }));

    const createData: Prisma.ProfileUncheckedCreateInput = {
      supabaseUserId: user.id,
      handle,
      displayName,
      avatarUrl,
      userTypeId:
        options && Object.prototype.hasOwnProperty.call(options, 'userTypeId')
          ? options.userTypeId ?? null
          : null,
    };

    const updateData: Prisma.ProfileUncheckedUpdateInput = {
      displayName,
      avatarUrl,
    };

    if (options && Object.prototype.hasOwnProperty.call(options, 'userTypeId')) {
      updateData.userTypeId = options.userTypeId ?? null;
    }

    if (!existingProfile?.handle) {
      updateData.handle = handle;
    }

    await this.prisma.profile.upsert({
      where: { supabaseUserId: user.id },
      create: createData,
      update: updateData,
    });
  }

  private async fetchProfileWithAccess(supabaseUserId: string) {
    return this.prisma.profile.findUnique({
      where: { supabaseUserId },
      include: {
        userType: {
          include: {
            userGroup: true,
            pageRoles: {
              include: {
                page: true,
              },
            },
          },
        },
      },
    });
  }

  private mapUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      appMetadata: user.app_metadata,
      userMetadata: user.user_metadata,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
    };
  }

  private mapProfile(profile: ProfileWithAccess | null) {
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      supabaseUserId: profile.supabaseUserId,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      userType: profile.userType
        ? {
            id: profile.userType.id,
            name: profile.userType.name,
            description: profile.userType.description,
            isActive: profile.userType.isActive,
            userGroup: profile.userType.userGroup
              ? {
                  id: profile.userType.userGroup.id,
                  name: profile.userType.userGroup.name,
                }
              : null,
            pageRoles: profile.userType.pageRoles.map((role) => ({
              id: role.id,
              role: role.role,
              page: role.page
                ? {
                    id: role.page.id,
                    key: role.page.key,
                    name: role.page.name,
                    path: role.page.path,
                  }
                : null,
            })),
          }
        : null,
    };
  }

  private async ensureUserTypeExists(userTypeId: string) {
    const userType = await this.prisma.userType.findUnique({
      where: { id: userTypeId },
      select: { id: true },
    });

    if (!userType) {
      throw new BadRequestException('Tipo de usuario informado nao existe.');
    }
  }

  private async generateUniqueHandle(options: { displayName: string | null; email: string | null | undefined }) {
    const candidates = [
      this.slugify(options.displayName),
      this.slugify(options.email ? options.email.split('@')[0] ?? null : null),
    ].filter((value): value is string => Boolean(value));

    if (candidates.length === 0) {
      candidates.push('user');
    }

    for (const base of candidates) {
      const candidate = await this.tryHandleVariants(base);
      if (candidate) {
        return candidate;
      }
    }

    return `user${this.randomSuffix()}`;
  }

  private async tryHandleVariants(base: string) {
    const normalized = base.slice(0, 20);

    for (let attempt = 0; attempt < 5; attempt++) {
      const suffix = attempt === 0 ? '' : this.randomSuffix();
      const candidate = `${normalized}${suffix}`.replace(/-+$/, '');

      if (candidate.length < 3) {
        continue;
      }

      const exists = await this.prisma.profile.findUnique({
        where: { handle: candidate },
        select: { id: true },
      });

      if (!exists) {
        return candidate;
      }
    }

    return null;
  }

  private slugify(value: string | null | undefined) {
    if (!value) {
      return '';
    }

    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20);
  }

  private randomSuffix() {
    return randomBytes(2).toString('hex');
  }
}
