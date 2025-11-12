import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../supabase/guards/supabase-auth.guard';
import { MathController } from './math.controller';
import { MathService } from './math.service';

@Module({
  controllers: [MathController],
  providers: [MathService, SupabaseAuthGuard],
})
export class MathModule {}
