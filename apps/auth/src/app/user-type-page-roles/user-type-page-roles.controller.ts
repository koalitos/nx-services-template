import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateUserTypePageRoleDto } from './dto/create-user-type-page-role.dto';
import { UpdateUserTypePageRoleDto } from './dto/update-user-type-page-role.dto';
import { UserTypePageRolesService } from './user-type-page-roles.service';

@ApiTags('user-type-page-roles')
@Controller('user-type-page-roles')
export class UserTypePageRolesController {
  constructor(private readonly userTypePageRolesService: UserTypePageRolesService) {}

  @Post()
  @ApiOperation({ summary: 'Vincula uma role de página a um tipo de usuário.' })
  @ApiCreatedResponse({ description: 'Role criada com sucesso.' })
  create(@Body() dto: CreateUserTypePageRoleDto) {
    return this.userTypePageRolesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista roles de página, com filtros opcionais.' })
  @ApiQuery({
    name: 'userTypeId',
    required: false,
    description: 'Filtra as roles por tipo de usuário.',
  })
  @ApiQuery({
    name: 'pageId',
    required: false,
    description: 'Filtra as roles por página.',
  })
  @ApiOkResponse({ description: 'Roles retornadas.' })
  findAll(
    @Query('userTypeId', new ParseUUIDPipe({ version: '4', optional: true })) userTypeId?: string,
    @Query('pageId', new ParseUUIDPipe({ version: '4', optional: true })) pageId?: string
  ) {
    return this.userTypePageRolesService.findAll({ userTypeId, pageId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtém detalhes de uma role de página.' })
  @ApiOkResponse({ description: 'Role retornada.' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userTypePageRolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma role de página.' })
  @ApiOkResponse({ description: 'Role atualizada.' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserTypePageRoleDto
  ) {
    return this.userTypePageRolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma role de página.' })
  @ApiOkResponse({ description: 'Role removida.' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.userTypePageRolesService.remove(id);
  }
}
