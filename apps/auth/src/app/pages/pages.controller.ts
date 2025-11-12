import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { PagesService } from './pages.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@ApiTags('pages')
@UseGuards(AdminApiKeyGuard)
@Controller('pages')
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma página que pode ser protegida por roles.' })
  @ApiCreatedResponse({ description: 'Página criada com sucesso.' })
  create(@Body() dto: CreatePageDto) {
    return this.pagesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todas as páginas cadastradas.' })
  @ApiOkResponse({ description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.pagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consulta detalhes de uma página.' })
  @ApiOkResponse({ description: 'Página recuperada.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados de uma página.' })
  @ApiOkResponse({ description: 'Página atualizada.' })
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdatePageDto) {
    return this.pagesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma página e seus vínculos.' })
  @ApiOkResponse({ description: 'Página removida.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.pagesService.remove(id);
  }
}
