import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateUserTypePageRoleDto {
  @ApiProperty({
    example: 'a30c1d20-aa1f-4b4b-9c61-5dcb831c3c63',
    description: 'ID do tipo de usuário que receberá a permissão.',
  })
  @IsUUID(4)
  userTypeId!: string;

  @ApiProperty({
    example: 'e18cf515-9ba0-4c7e-822b-6f52a4cc25ed',
    description: 'ID da página protegida pela role.',
  })
  @IsUUID(4)
  pageId!: string;

  @ApiProperty({
    example: 'viewer',
    description: 'Nome da role aplicada na página (ex.: viewer, editor).',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  role!: string;
}
