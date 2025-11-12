import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const globalPrefix = 'auth';
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
    .setTitle('Auth Service')
    .setDescription('Microservico dedicado a registrar e autenticar usuarios via Supabase.')
    .setVersion('1.0.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, swaggerDocument, {
    jsonDocumentUrl: `${globalPrefix}/docs/swagger.json`,
  });

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  const appUrl = await app.getUrl();
  console.info(
    `Auth service em execucao: ${appUrl.replace(/\/$/, '')}/${globalPrefix} (Swagger em /${globalPrefix}/docs)`
  );
}

bootstrap();
