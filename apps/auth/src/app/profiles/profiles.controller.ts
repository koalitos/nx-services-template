import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { UpdateProfileUserTypeDto } from './dto/update-profile-user-type.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista perfis sincronizados com o Supabase.' })
  @ApiOkResponse({ description: 'Perfis retornados.' })
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':supabaseUserId')
  @ApiOperation({ summary: 'Obtém um perfil específico.' })
  @ApiOkResponse({ description: 'Perfil retornado.' })
  findOne(@Param('supabaseUserId') supabaseUserId: string) {
    return this.profilesService.findOne(supabaseUserId);
  }

  @Patch(':supabaseUserId/user-type')
  @ApiOperation({ summary: 'Define ou remove o tipo de usuário de um perfil.' })
  @ApiOkResponse({ description: 'Perfil atualizado.' })
  updateUserType(
    @Param('supabaseUserId') supabaseUserId: string,
    @Body() dto: UpdateProfileUserTypeDto
  ) {
    return this.profilesService.updateUserType(supabaseUserId, dto);
  }
}
