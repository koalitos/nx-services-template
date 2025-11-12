import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SupabaseAuthUser } from '../interfaces/supabase-user.interface';

export const SupabaseUser = createParamDecorator(
  (_data: never, ctx: ExecutionContext): SupabaseAuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: SupabaseAuthUser }>();
    return request.user;
  }
);
