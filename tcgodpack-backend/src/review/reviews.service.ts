import { Injectable, BadRequestException } from '@nestjs/common';
import { Review } from './review.model';
import { JsonHandlerService } from '../json-handler/json-handler.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly jsonHandler: JsonHandlerService,
    private readonly profileService: ProfileService,
  ) {}

  async obtenerTodasReviews(): Promise<Review[]> {
    return this.jsonHandler.readData<Review>('reviews');
  }

  async obtenerPorProducto(productName: string): Promise<Review[]> {
    const reviews = await this.obtenerTodasReviews();
    return reviews.filter(
      (review) => review.productName?.toLowerCase() === productName.toLowerCase(),
    );
  }

  async obtenerPorEmail(email: string): Promise<Review[]> {
    const reviews = await this.obtenerTodasReviews();
    return reviews.filter(
      (review) => review.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async crearReview(review: Review): Promise<Review> {
    const productName = String(review.productName ?? '').trim();
    const email = String(review.email ?? '').trim();
    const comment = String(review.comment ?? '').trim();
    const rating = Number(review.rating);

    if (!productName) throw new BadRequestException('productName is required');
    if (!email) throw new BadRequestException('email is required');
    if (!comment) throw new BadRequestException('comment is required');
    if (!Number.isFinite(rating) || rating < 1 || rating > 5)
      throw new BadRequestException('rating must be a number between 1 and 5');

    // Verificamos que el usuario haya comprado el producto antes de permitir reseñar
    const perfil = await this.profileService.obtenerPorCorreo(email);
    if (!perfil) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const purchased: string[] = Array.isArray(perfil.purchasedProducts)
      ? perfil.purchasedProducts.map((p) => String(p).toLowerCase())
      : [];

    if (!purchased.includes(productName.toLowerCase())) {
      throw new BadRequestException('El usuario no ha comprado este producto');
    }

    const reviews = await this.obtenerTodasReviews();
    
    const escribioResena = reviews.some(
      (r) =>
        r.productName?.toLowerCase() === productName.toLowerCase() &&
        r.email.toLowerCase() === email.toLowerCase(),
    );

    if (escribioResena) {
      throw new BadRequestException('El usuario ya ha escrito una reseña para este producto');
    }
  
    const nuevaReview = new Review(productName, email, comment, rating);

    reviews.push(nuevaReview);
    await this.jsonHandler.writeData('reviews', reviews);

    return nuevaReview;
  }
}
