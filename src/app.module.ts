import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LooksModule } from './looks/looks.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { MoneyModule } from './common/money/money.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CommunityModule } from './modules/community/community.module.js';
import { RequestsModule } from './modules/requests/requests.module.js';
import { QuotationsModule } from './modules/quotations/quotations.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    MoneyModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    CommunityModule,
    RequestsModule,
    QuotationsModule,
    LooksModule,
    ProductsModule,
    OrdersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
