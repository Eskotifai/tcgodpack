import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Review } from '../shared/interfaces/review';

@Injectable({
  providedIn: 'root',
})
// aqui estan los endpoints de las reviews, se llama desde el review-form-page para obtener las reviews de un producto y para publicar una nueva review
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';

  getReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.baseUrl}/reviews`);
  }     

  getReviewsByProduct(productName: string): Observable<Review[]> {
    const url = `${this.baseUrl}/reviews/by-product?productName=${encodeURIComponent(productName)}`;
    return this.http.get<Review[]>(url).pipe(
      map(data => Array.isArray(data) ? data : [])
    );
  }

  postReview(review: Review): Observable<Review> {
    return this.http.post<Review>(`${this.baseUrl}/reviews`, review);
  }

  userCanReview(email: string, productName: string): Observable<boolean> {
    return this.http
      .get<any>(`${this.baseUrl}/profile?email=${encodeURIComponent(email)}`)
      .pipe(
        map(profile => {
          const purchased: string[] = Array.isArray(profile?.purchasedProducts)
            ? profile.purchasedProducts.map((p: any) => String(p).toLowerCase())
            : [];
          return purchased.includes(String(productName).toLowerCase());
        })
      );
  }

}




