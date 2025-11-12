import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { UpdateUserGroupDto } from './dto/update-user-group.dto';
import { UserGroupsService } from './user-groups.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@ApiTags('user-groups')
@UseGuards(AdminApiKeyGuard)
@Controller('user-groups')
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo grupo de usuário.' })
  @ApiCreatedResponse({ description: 'Grupo criado com sucesso.' })
  create(@Body() dto: CreateUserGroupDto) {
    return this.userGroupsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os grupos registrados.' })
  @ApiOkResponse({ description: 'Lista retornada com sucesso.' })
  findAll() {
    return this.userGroupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um grupo específico pelo ID.' })
  @ApiOkResponse({ description: 'Grupo retornado com sucesso.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userGroupsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza parcialmente um grupo.' })
  @ApiOkResponse({ description: 'Grupo atualizado com sucesso.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserGroupDto
  ) {
    return this.userGroupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um grupo do catálogo.' })
  @ApiOkResponse({ description: 'Grupo removido com sucesso.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userGroupsService.remove(id);
  }
}
