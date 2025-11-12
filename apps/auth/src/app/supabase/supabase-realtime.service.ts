import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

interface BroadcastPayload<T> {
  channel?: string;
  event: string;
  payload: T;
}

@Injectable()
export class SupabaseRealtimeService {
  private readonly logger = new Logger(SupabaseRealtimeService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService
  ) {}

  async notifyCalculation<T extends Record<string, unknown>>(payload: T) {
    const eventChannel = this.configService.get<string>(
      'SUPABASE_REALTIME_CHANNEL',
      'calculations'
    );

    await this.broadcast({
      channel: eventChannel,
      event: 'calculation.performed',
      payload,
    });
  }

  async broadcast<T>({
    channel = 'public',
    event,
    payload,
  }: BroadcastPayload<T>) {
    const client = this.supabaseService.getServiceRoleClient();
    const realtimeChannel = client.channel(channel, {
      config: {
        broadcast: { ack: true },
      },
    });

    const subscribedChannel = await this.subscribe(realtimeChannel, channel);
    const sendResult = await subscribedChannel.send({
      type: 'broadcast',
      event,
      payload,
    });

    await subscribedChannel.unsubscribe();

    if (sendResult !== 'ok') {
      this.logger.error(
        `Falha ao enviar evento ${event} para ${channel}`,
        sendResult
      );
      throw new InternalServerErrorException(
        `Falha ao enviar evento realtime: retorno ${sendResult}`
      );
    }
  }

  private async subscribe(
    channel: SupabaseRealtimeChannel,
    channelName: string
  ): Promise<SupabaseRealtimeChannel> {
    return new Promise((resolve, reject) => {
      channel.subscribe((status, err) => {
        if (err) {
          reject(
            new InternalServerErrorException(
              `Erro ao conectar no canal ${channelName}: ${err.message}`
            )
          );
          return;
        }

        switch (status) {
          case SUBSCRIPTION_STATES.SUBSCRIBED:
            resolve(channel);
            break;
          case SUBSCRIPTION_STATES.TIMED_OUT:
            reject(
              new InternalServerErrorException(
                `Timeout ao conectar no canal ${channelName}`
              )
            );
            break;
          case SUBSCRIPTION_STATES.CLOSED:
            reject(
              new InternalServerErrorException(
                `Canal ${channelName} foi fechado antes do envio`
              )
            );
            break;
          case SUBSCRIPTION_STATES.CHANNEL_ERROR:
            reject(
              new InternalServerErrorException(
                `Canal ${channelName} retornou erro antes do envio`
              )
            );
            break;
          default:
            break;
        }
      });
    });
  }
}

type SupabaseRealtimeChannel = ReturnType<SupabaseClient['channel']>;

const SUBSCRIPTION_STATES = {
  SUBSCRIBED: 'SUBSCRIBED',
  TIMED_OUT: 'TIMED_OUT',
  CLOSED: 'CLOSED',
  CHANNEL_ERROR: 'CHANNEL_ERROR',
} as const;
