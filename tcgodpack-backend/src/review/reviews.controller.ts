import { Body, Controller, Get, Query, Post } from '@nestjs/common';
import { Review } from './review.model';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async obtenerResenas(
    @Query('productName') productName?: string,
    @Query('email') email?: string,
  ): Promise<Review[]> {
    if (productName) {
      return this.reviewsService.obtenerPorProducto(productName);
    }
    if (email) {
      return this.reviewsService.obtenerPorEmail(email);
    }
    return this.reviewsService.obtenerTodasReviews();
  }

  @Post()
  async crearResena(@Body() review: Review): Promise<Review> {
    return this.reviewsService.crearReview(review);
  }
}
