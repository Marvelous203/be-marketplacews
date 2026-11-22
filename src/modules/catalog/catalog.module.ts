import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';
import { PublicCatalogController } from './public-catalog.controller.js';
import { AdminCatalogController } from './admin-catalog.controller.js';
import { MoneyModule } from '../../common/money/money.module.js';

@Module({
  imports: [MoneyModule],
  controllers: [PublicCatalogController, AdminCatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
