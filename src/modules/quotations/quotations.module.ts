import { Module, forwardRef } from '@nestjs/common';
import { QuotationsService } from './quotations.service.js';
import { AdminQuotationsController } from './admin-quotations.controller.js';
import { PublicQuotationsController } from './public-quotations.controller.js';
import { MoneyModule } from '../../common/money/money.module.js';
import { RequestsModule } from '../requests/requests.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MarketplaceOrdersModule } from '../marketplace-orders/marketplace-orders.module.js';

@Module({
  imports: [
    MoneyModule,
    RequestsModule,
    AuthModule,
    forwardRef(() => MarketplaceOrdersModule),
  ],
  controllers: [AdminQuotationsController, PublicQuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
