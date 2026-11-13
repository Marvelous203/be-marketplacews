import { Module } from '@nestjs/common';
import { LooksController } from './looks.controller.js';
import { LooksService } from './looks.service.js';

@Module({
  controllers: [LooksController],
  providers: [LooksService],
})
export class LooksModule {}
