import { Module } from '@nestjs/common';
import { UserGroupsController } from './user-groups.controller';
import { UserGroupsService } from './user-groups.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@Module({
  controllers: [UserGroupsController],
  providers: [UserGroupsService, AdminApiKeyGuard],
  exports: [UserGroupsService],
})
export class UserGroupsModule {}
