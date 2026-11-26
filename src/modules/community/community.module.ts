import { Module } from '@nestjs/common';
import { MoneyModule } from '../../common/money/money.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { CommunityController } from './community.controller.js';
import { CommunityService } from './community.service.js';
import { PublicCommunityController } from './public-community.controller.js';

@Module({
  imports: [MoneyModule, AuthModule],
  controllers: [PublicCommunityController, CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
