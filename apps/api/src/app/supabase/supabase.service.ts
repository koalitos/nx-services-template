import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, User, createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly serviceRoleClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY'
    );

    if (!url || !serviceRoleKey || !anonKey) {
      throw new Error('Supabase credentials are missing in environment vars');
    }

    const sharedOptions = {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          'x-template-name': 'template-supa',
        },
      },
    };

    this.serviceRoleClient = createClient(url, serviceRoleKey, sharedOptions);
    this.anonClient = createClient(url, anonKey, sharedOptions);
  }

  getServiceRoleClient(): SupabaseClient {
    return this.serviceRoleClient;
  }

  getPublicClient(): SupabaseClient {
    return this.anonClient;
  }

  async validateAccessToken(token: string): Promise<User> {
    const { data, error } = await this.anonClient.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException('Token Supabase inválido ou expirado.');
    }

    return data.user;
  }
}
