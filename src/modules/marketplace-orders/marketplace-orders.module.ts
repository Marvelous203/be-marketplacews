import { Module, forwardRef } from '@nestjs/common';
import { MarketplaceOrdersService } from './marketplace-orders.service.js';
import { PublicOrdersController } from './public-orders.controller.js';
import { AdminOrdersController } from './admin-orders.controller.js';
import { MoneyModule } from '../../common/money/money.module.js';
import { QuotationsModule } from '../quotations/quotations.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [MoneyModule, AuthModule, forwardRef(() => QuotationsModule)],
  controllers: [PublicOrdersController, AdminOrdersController],
  providers: [MarketplaceOrdersService],
  exports: [MarketplaceOrdersService],
})
export class MarketplaceOrdersModule {}
