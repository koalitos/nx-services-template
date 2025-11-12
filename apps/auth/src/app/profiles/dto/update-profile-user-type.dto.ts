import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateProfileUserTypeDto {
  @ApiPropertyOptional({
    description: 'ID do tipo de usuario associado ao perfil. Use null para remover.',
    example: 'b3fb2e15-e8cd-4da2-8b74-1f642b2c1e89',
    nullable: true,
  })
  @IsOptional()
  @IsUUID(4)
  userTypeId?: string | null;
}
