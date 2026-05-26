import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JsonHandlerModule } from '../shared/json-handler/json-handler.module';

@Module({
  imports: [JsonHandlerModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
