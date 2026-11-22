import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import { AppModule } from './app.module.js';

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Website Solution Marketplace API')
    .setDescription('Backend API for Website Marketplace & Multi-tenant platform')
    .setVersion('1.0')
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

