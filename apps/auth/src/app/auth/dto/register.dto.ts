import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email que sera utilizado no Supabase Auth.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'MySecret123',
    minLength: 6,
    description: 'Senha inicial do usuario Supabase.',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'Nome exibido salvo no Profile local.',
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Identificador do tipo de usuario que define as roles do perfil.',
    example: '1bfa0a3b-e8c1-424d-95ed-a95955c8c5db',
  })
  @IsOptional()
  @IsUUID(4)
  userTypeId?: string;
}
