import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedKey = this.configService.get<string>('ADMIN_API_KEY');

    if (!expectedKey) {
      throw new InternalServerErrorException('ADMIN_API_KEY nao configurada.');
    }

    const headerKey =
      request.header('x-admin-key') ??
      this.extractFromAuthorization(request.header('authorization'));

    if (headerKey && headerKey === expectedKey) {
      return true;
    }

    throw new UnauthorizedException('Chave administrativa invalida.');
  }

  private extractFromAuthorization(header?: string | null) {
    if (!header) return undefined;
    if (!header.toLowerCase().startsWith('bearer ')) return undefined;
    return header.slice(7);
  }
}
