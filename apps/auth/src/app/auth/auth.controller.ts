import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cria um usuario no Supabase Auth',
    description:
      'Utiliza a Service Role Key para criar um novo usuario e sincroniza o Profile local.',
  })
  @ApiCreatedResponse({
    description: 'Usuario criado com sucesso.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login com email e senha do Supabase',
    description:
      'Retorna o access_token (JWT) e refresh_token para ser utilizado nas rotas protegidas.',
  })
  @ApiOkResponse({
    description: 'Sessao criada com sucesso.',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
