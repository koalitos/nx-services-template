import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Healthcheck do servico de auth',
    description: 'Retorna status basico do microservico de autenticacao.',
  })
  getHealth() {
    return this.appService.getHealth();
  }
}
