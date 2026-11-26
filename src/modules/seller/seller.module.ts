import { Module } from '@nestjs/common';
import { MoneyModule } from '../../common/money/money.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { SellerController } from './seller.controller.js';
import { SellerService } from './seller.service.js';

@Module({
  imports: [MoneyModule, AuthModule, RequestsModule],
  controllers: [SellerController],
  providers: [SellerService],
  exports: [SellerService],
})
export class SellerModule {}
