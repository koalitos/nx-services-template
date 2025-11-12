import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { AdminApiKeyGuard } from '../common/guards/admin-api-key.guard';

@Module({
  controllers: [PagesController],
  providers: [PagesService, AdminApiKeyGuard],
  exports: [PagesService],
})
export class PagesModule {}
