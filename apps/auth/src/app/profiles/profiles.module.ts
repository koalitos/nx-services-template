import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@Module({
  controllers: [ProfilesController],
  providers: [ProfilesService, AdminApiKeyGuard],
})
export class ProfilesModule {}
