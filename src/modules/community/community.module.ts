import { Module } from '@nestjs/common';
import { CommunityService } from './community.service.js';
import { PublicCommunityController } from './public-community.controller.js';

@Module({
  controllers: [PublicCommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
