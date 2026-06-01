import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './product/products.module';
import { CartModule } from './cart/cart.module';
import { ReviewsModule } from './review/reviews.module';
import { JsonHandlerModule } from './shared/json-handler/json-handler.module';

@Module({
  imports: [ProfileModule, AuthModule, ProductsModule, CartModule, ReviewsModule, JsonHandlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
