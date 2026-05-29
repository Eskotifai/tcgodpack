import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { JsonHandlerModule } from '../shared/json-handler/json-handler.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  controllers: [ReviewsController],
  providers: [ReviewsService],
  imports: [JsonHandlerModule, ProfileModule],
})
export class ReviewsModule {}
