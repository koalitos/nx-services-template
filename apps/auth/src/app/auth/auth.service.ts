import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService
  ) {}

  async register(dto: RegisterDto) {
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

    const profile = await this.prisma.profile.upsert({
      where: { supabaseUserId: data.user.id },
      update: {
        displayName:
          dto.displayName ??
          (data.user.user_metadata?.displayName as string | undefined) ??
          null,
      },
      create: {
        supabaseUserId: data.user.id,
        displayName:
          dto.displayName ??
          (data.user.user_metadata?.displayName as string | undefined) ??
          null,
      },
    });

    return {
      message: 'Usuario criado com sucesso.',
      user: this.mapUser(data.user),
      profile,
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

    return {
      tokenType: 'bearer',
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      user: this.mapUser(data.user),
    };
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
}
