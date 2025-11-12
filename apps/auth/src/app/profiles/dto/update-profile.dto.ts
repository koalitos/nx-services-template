import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nome exibido do usuário.',
    example: 'Maria Joaquina',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'URL do avatar a ser exibido nas aplicações cliente.',
    example: 'https://cdn.example.com/avatar.png',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
