import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseService } from '../supabase.service';
import { SupabaseAuthUser } from '../interfaces/supabase-user.interface';

interface SupabaseRequest extends Request {
  user?: SupabaseAuthUser;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SupabaseRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Cabeçalho Authorization ausente.');
    }

    const user = await this.supabaseService.validateAccessToken(token);
    request.user = user;

    return true;
  }

  private extractToken(request: Request): string | null {
    const authHeader =
      request.get('authorization') || request.get('Authorization');
    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido.');
    }

    return token;
  }
}
