import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: true,
    })
  );
  app.enableCors({ origin: true, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Supabase Ready API')
    .setDescription(
      'Template NestJS + Nx backend com autenticação via Supabase, Prisma e Realtime.'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Cole aqui o access_token recebido do Supabase Auth.',
      },
      'supabase-auth'
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, swaggerDocument, {
    jsonDocumentUrl: `${globalPrefix}/docs/swagger.json`,
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  const appUrl = await app.getUrl();
  console.info(
    `🚀 API em execução: ${appUrl.replace(/\/$/, '')}/${globalPrefix} (Swagger em /${globalPrefix}/docs)`
  );
}

bootstrap();
