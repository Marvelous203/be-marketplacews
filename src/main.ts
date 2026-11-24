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
    .setTitle('VELL Fashion & Marketplace API')
    .setDescription('Backend API for Website Marketplace & VELL Shop. Swagger at /api-docs')
    .setVersion('1.1')
    .addBearerAuth()
    .addTag('Authentication & Identity', 'Đăng nhập, xác thực JWT và thông tin tài khoản')
    .addTag('Admin Users & Tenant Roles Management', 'Quản lý người dùng, phân quyền Admin Owner và Sub-roles')
    .addTag('Admin Catalog Management', 'Quản trị danh mục, tags, giải pháp và gói chào giá')
    .addTag('Admin Quote Requests', 'Quản trị yêu cầu dự án tùy biến')
    .addTag('Admin Quotations', 'Quản trị hồ sơ báo giá')
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
