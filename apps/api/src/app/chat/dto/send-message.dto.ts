import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    description: 'Conteúdo em texto puro que será criptografado antes do armazenamento.',
    example: 'Olá! Precisamos revisar o contrato até amanhã.',
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
