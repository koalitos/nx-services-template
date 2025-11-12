import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SupabaseUser } from '../supabase/decorators/supabase-user.decorator';
import { SupabaseAuthGuard } from '../supabase/guards/supabase-auth.guard';
import { SupabaseAuthUser } from '../supabase/interfaces/supabase-user.interface';
import { AddNumbersDto } from './dto/add-numbers.dto';
import { MathService } from './math.service';

@ApiTags('math')
@ApiBearerAuth('supabase-auth')
@UseGuards(SupabaseAuthGuard)
@Controller('math')
export class MathController {
  constructor(private readonly mathService: MathService) {}

  @ApiOperation({
    summary: 'Soma dois números',
    description:
      'Recebe dois números, valida com class-validator, persiste no Prisma e dispara um evento no Supabase Realtime.',
  })
  @Post('add')
  add(
    @SupabaseUser() user: SupabaseAuthUser | undefined,
    @Body() dto: AddNumbersDto
  ) {
    if (!user) {
      throw new UnauthorizedException('Usuário Supabase não encontrado.');
    }
    return this.mathService.addNumbers(user, dto);
  }
}
