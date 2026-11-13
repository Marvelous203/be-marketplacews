import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: ['http://localhost:3000'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('VELL Fashion API')
    .setDescription('Backend API for VELL Fashion Shop. Connect to swagger at /api-docs')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Auto-export swagger.json for openapi-typescript code generation
  const fs = await import('fs');
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  console.log('Exported swagger.json');

  await app.listen(process.env.PORT ?? 3001);
  console.log('VELL API running on http://localhost:3001');
  console.log('Swagger docs at http://localhost:3001/api-docs');
}
await bootstrap();
