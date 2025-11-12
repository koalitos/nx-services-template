import { Module } from '@nestjs/common';
import { UserTypesController } from './user-types.controller';
import { UserTypesService } from './user-types.service';

@Module({
  controllers: [UserTypesController],
  providers: [UserTypesService],
})
export class UserTypesModule {}
