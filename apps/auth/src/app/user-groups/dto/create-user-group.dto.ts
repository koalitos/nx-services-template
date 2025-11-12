import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserGroupDto {
  @ApiProperty({
    example: 'Administradores',
    description: 'Nome legível do grupo.',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({
    example: 'Grupo com permissões administrativas.',
    description: 'Breve descrição do grupo.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Controla se o grupo está ativo e pode ser associado a usuários.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
