import { Module } from '@nestjs/common';
import { UserTypesController } from './user-types.controller';
import { UserTypesService } from './user-types.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@Module({
  controllers: [UserTypesController],
  providers: [UserTypesService, AdminApiKeyGuard],
})
export class UserTypesModule {}
