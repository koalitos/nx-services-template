import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserTypeDto {
  @ApiProperty({
    example: 'Supervisor',
    minLength: 3,
    description: 'Nome do tipo de usuário.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name!: string;

  @ApiPropertyOptional({
    example: 'Usuário com poderes intermediários.',
    description: 'Descrição opcional do tipo.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Indica se o tipo está ativo.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'de305d54-75b4-431b-adb2-eb6b9e546014',
    description: 'ID do grupo ao qual o tipo pertence.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID(4)
  userGroupId?: string | null;
}
