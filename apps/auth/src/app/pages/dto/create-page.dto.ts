import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreatePageDto {
  @ApiProperty({
    example: 'dashboard.home',
    description: 'Identificador único utilizado para controlar acesso.',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+([-.][a-z0-9]+)*$/i, {
    message: 'key deve conter apenas letras, números, pontos ou hífens.',
  })
  key!: string;

  @ApiProperty({
    example: 'Painel principal',
    description: 'Nome exibido da página.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: '/dashboard',
    description: 'Path ou URL relativo usado no frontend.',
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({
    example: 'Visão geral do produto e métricas.',
    description: 'Descrição breve da página.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Define se a página está ativa para associação.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
