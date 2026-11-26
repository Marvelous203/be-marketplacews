import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module.js';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Website Solution Marketplace & VELL Platform API')
    .setDescription('Backend API for Website Marketplace & Multi-tenant platform with 5 Roles & Tenant Sub-roles')
    .setVersion('1.1')
    .addBearerAuth()
    .addTag('Authentication & Identity', 'Đăng nhập, xác thực JWT và thông tin tài khoản')
    .addTag('Admin Users & Tenant Roles Management', 'Quản lý người dùng, phân quyền Admin Owner và Sub-roles')
    .addTag('Admin Catalog Management', 'Quản trị danh mục, tags, giải pháp và gói chào giá')
    .addTag('Admin Quote Requests', 'Quản trị yêu cầu dự án tùy biến')
    .addTag('Admin Quotations', 'Quản trị hồ sơ báo giá')
    .addTag('Public & Customer Marketplace Orders', 'Tra cứu đơn hàng, tiến độ thanh toán & VietQR')
    .addTag('Admin Marketplace Orders & Payments', 'Quản trị đơn hàng và thu tiền ngoại tuyến')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
  console.log('Successfully generated swagger.json');
  await app.close();
  process.exit(0);
}

generate().catch((err) => {
  console.error('Failed to generate swagger:', err);
  process.exit(1);
});

