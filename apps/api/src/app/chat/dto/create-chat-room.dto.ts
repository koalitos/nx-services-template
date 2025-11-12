import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateChatRoomDto {
  @ApiProperty({
    description: 'Nome amigavel da sala, exibido para os participantes.',
    example: 'Suporte Premium',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    description:
      'Lista de IDs Supabase dos demais participantes. O remetente atual e adicionado automaticamente.',
    example: ['8a9f0c78-45d4-4ce0-a677-ff1cb8e9e61f'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  participantIds!: string[];
}
