import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: ['http://localhost:3000'], credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');

  // Ensure public/uploads directory exists
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  mkdirSync(uploadsDir, { recursive: true });

  // Serve static assets from public/uploads at /uploads/
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  const config = new DocumentBuilder()
    .setTitle('VELL Fashion API')
    .setDescription('Backend API for VELL Fashion Shop. Connect to swagger at /api-docs')
    .setVersion('1.0')
    .addTag('looks', 'Lookbook & outfit styling endpoints')
    .addTag('products', 'Product catalog & mix-and-match upload endpoints')
    .addTag('orders', 'Order processing & checkout endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log('VELL API running on http://localhost:3001');
  console.log('Swagger docs at http://localhost:3001/api-docs');
}
await bootstrap();
