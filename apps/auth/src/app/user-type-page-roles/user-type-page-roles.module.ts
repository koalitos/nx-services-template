import { Module } from '@nestjs/common';
import { UserTypePageRolesController } from './user-type-page-roles.controller';
import { UserTypePageRolesService } from './user-type-page-roles.service';

@Module({
  controllers: [UserTypePageRolesController],
  providers: [UserTypePageRolesService],
  exports: [UserTypePageRolesService],
})
export class UserTypePageRolesModule {}
