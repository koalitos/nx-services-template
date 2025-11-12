import { Module } from '@nestjs/common';
import { UserTypePageRolesController } from './user-type-page-roles.controller';
import { UserTypePageRolesService } from './user-type-page-roles.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@Module({
  controllers: [UserTypePageRolesController],
  providers: [UserTypePageRolesService, AdminApiKeyGuard],
  exports: [UserTypePageRolesService],
})
export class UserTypePageRolesModule {}
