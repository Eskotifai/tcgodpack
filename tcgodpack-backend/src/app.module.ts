import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { ReviewsModule } from './reviews/reviews.module';
import { JsonHandlerModule } from './shared/json-handler/json-handler.module';

@Module({
  imports: [ProfileModule, ProductsModule, CartModule, ReviewsModule, JsonHandlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
