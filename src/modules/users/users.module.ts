import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
