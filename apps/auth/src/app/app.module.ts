import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UserGroupsModule } from './user-groups/user-groups.module';
import { UserTypesModule } from './user-types/user-types.module';
import { PagesModule } from './pages/pages.module';
import { UserTypePageRolesModule } from './user-type-page-roles/user-type-page-roles.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3001),
        DATABASE_URL: Joi.string().uri().required(),
        SUPABASE_URL: Joi.string().uri().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        ADMIN_API_KEY: Joi.string().min(16).required(),
      }),
    }),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UserGroupsModule,
    UserTypesModule,
    PagesModule,
    UserTypePageRolesModule,
    ProfilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
