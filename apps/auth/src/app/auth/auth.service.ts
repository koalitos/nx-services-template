import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
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

    const createData: Prisma.ProfileUncheckedCreateInput = {
      supabaseUserId: user.id,
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
}
