import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LooksModule } from './looks/looks.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { MoneyModule } from './common/money/money.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { CommunityModule } from './modules/community/community.module.js';

@Module({
  imports: [MoneyModule, CatalogModule, CommunityModule, LooksModule, ProductsModule, OrdersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
