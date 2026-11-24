import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service.js';
import { PublicRequestsController } from './public-requests.controller.js';
import { AdminRequestsController } from './admin-requests.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [PublicRequestsController, AdminRequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
