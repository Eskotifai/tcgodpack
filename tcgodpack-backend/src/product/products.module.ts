import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JsonHandlerModule } from '../json-handler/json-handler.module';

@Module({
  imports: [JsonHandlerModule],
  controllers: [ProductsController],
  providers: [ProductsService]
})
export class ProductsModule {}
