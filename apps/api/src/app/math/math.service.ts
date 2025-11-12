import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseRealtimeService } from '../supabase/supabase-realtime.service';
import { SupabaseAuthUser } from '../supabase/interfaces/supabase-user.interface';
import { AddNumbersDto } from './dto/add-numbers.dto';

@Injectable()
export class MathService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: SupabaseRealtimeService
  ) {}

  async addNumbers(user: SupabaseAuthUser, payload: AddNumbersDto) {
    const { a, b } = payload;
    const result = a + b;

    await this.ensureProfile(user);

    const logEntry = await this.prisma.calculationLog.create({
      data: {
        operandA: a,
        operandB: b,
        result,
        supabaseUserId: user.id,
      },
    });

    await this.realtime.notifyCalculation({
      userId: user.id,
      operands: { a, b },
      result,
      logId: logEntry.id,
      createdAt: logEntry.createdAt,
    });

    return {
      result,
      logId: logEntry.id,
      supabaseUserId: user.id,
      recordedAt: logEntry.createdAt,
    };
  }

  private async ensureProfile(user: SupabaseAuthUser) {
    const displayName =
      (user.user_metadata?.displayName as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      null;

    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ??
      (user.user_metadata?.avatarUrl as string | undefined) ??
      null;

    await this.prisma.profile.upsert({
      where: { supabaseUserId: user.id },
      create: {
        supabaseUserId: user.id,
        handle: this.buildHandle(user),
        displayName,
        avatarUrl,
      },
      update: {
        displayName,
        avatarUrl,
      },
    });
  }

  private buildHandle(user: SupabaseAuthUser) {
    const existingHandle = (user.user_metadata?.handle as string | undefined)?.trim();
    if (existingHandle) {
      return existingHandle.toLowerCase();
    }

    const emailBase =
      user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? '';
    if (emailBase.length >= 3) {
      return `${emailBase}-${user.id.replace(/-/g, '').slice(0, 4)}`;
    }

    return `user-${user.id.replace(/-/g, '').slice(0, 8)}`;
  }
}
