import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserTypeDto } from './dto/create-user-type.dto';
import { UpdateUserTypeDto } from './dto/update-user-type.dto';
import { UserTypesService } from './user-types.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@ApiTags('user-types')
@UseGuards(AdminApiKeyGuard)
@Controller('user-types')
export class UserTypesController {
  constructor(private readonly userTypesService: UserTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo tipo de usuário.' })
  @ApiCreatedResponse({ description: 'Tipo criado com sucesso.' })
  create(@Body() dto: CreateUserTypeDto) {
    return this.userTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os tipos cadastrados.' })
  @ApiOkResponse({ description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.userTypesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um tipo específico pelo ID.' })
  @ApiOkResponse({ description: 'Tipo retornado com sucesso.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um tipo de usuário.' })
  @ApiOkResponse({ description: 'Tipo atualizado com sucesso.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserTypeDto
  ) {
    return this.userTypesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um tipo de usuário.' })
  @ApiOkResponse({ description: 'Tipo removido com sucesso.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userTypesService.remove(id);
  }
}
