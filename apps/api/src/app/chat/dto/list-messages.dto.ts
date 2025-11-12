import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsUUID, Max } from 'class-validator';

export class ListMessagesDto {
  @ApiPropertyOptional({
    description: 'Quantidade maxima de mensagens retornadas (default 50, max 100).',
    example: 25,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100)
  @Transform(({ value }) => (value !== undefined ? Number(value) : value))
  limit?: number;

  @ApiPropertyOptional({
    description: 'Cursor de paginacao (ID da mensagem) para buscar registros anteriores.',
    example: 'de305d54-75b4-431b-adb2-eb6b9e546014',
  })
  @IsOptional()
  @IsUUID('4')
  cursor?: string;
}
