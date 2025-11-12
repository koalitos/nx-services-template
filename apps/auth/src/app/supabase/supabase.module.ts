import { Global, Module } from '@nestjs/common';
import { SupabaseRealtimeService } from './supabase-realtime.service';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  providers: [SupabaseService, SupabaseRealtimeService],
  exports: [SupabaseService, SupabaseRealtimeService],
})
export class SupabaseModule {}
