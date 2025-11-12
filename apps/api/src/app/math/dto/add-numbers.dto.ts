import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class AddNumbersDto {
  @ApiProperty({ example: 5.5, description: 'Primeiro número a ser somado.' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  a!: number;

  @ApiProperty({ example: 10.2, description: 'Segundo número a ser somado.' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  b!: number;
}
