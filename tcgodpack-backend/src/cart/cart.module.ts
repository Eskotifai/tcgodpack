import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { JsonHandlerModule } from '../shared/json-handler/json-handler.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [JsonHandlerModule, ProfileModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
