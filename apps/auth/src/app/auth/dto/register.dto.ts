import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

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
}
