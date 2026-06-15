import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Cart } from '../shared/interfaces/cart';
import { Product } from '../shared/interfaces/product';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';

  getCart(email: string): Observable<Cart> {
    return this.http.get<Cart>(`${this.baseUrl}/cart?email=${encodeURIComponent(email)}`);
  }

  addToCart(email: string, product: Product, quantity: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart/add`, {
      email,
      product,
      quantity,
    });
  }

  removeFromCart(email: string, productNumber: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart/remove`, {
      email,
      productNumber,
    });
  }

  adjustCartItemQuantity(email: string, productNumber: number, delta: number): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart/adjust`, {
      email,
      productNumber,
      delta,
    });
  }

  checkoutCart(email: string): Observable<Cart> {
    return this.http.post<Cart>(`${this.baseUrl}/cart/checkout`, { email });
  }
}