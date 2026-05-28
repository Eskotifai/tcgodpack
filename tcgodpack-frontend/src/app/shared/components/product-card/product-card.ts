import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../../../services/cart.service';
import { Product } from '../../../shared/interfaces/product';

export type ProductCardFeedbackType = 'success' | 'error';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  @Input({ required: true }) product!: Product;
  @Input() currentUser: string | null = null;
  @Input() cartRemainingUnits = 10;
  @Output() addToCartFeedback = new EventEmitter<{
    message: string;
    type: ProductCardFeedbackType;
  }>();

  quantity = 1;
  quantitySelectorVisible = false;

  constructor(private readonly cartService: CartService) {}

  get maxQuantity(): number {
    return Math.max(
      0,
      Math.min(
        Math.floor(Number(this.product?.available ?? 0)),
        Math.floor(Number(this.cartRemainingUnits ?? 10)),
      ),
    );
  }

  get canDecreaseQuantity(): boolean {
    return this.quantity > 1;
  }

  get canIncreaseQuantity(): boolean {
    return this.quantity < this.maxQuantity;
  }

  get cartLimitReached(): boolean {
    return Math.max(0, Math.floor(Number(this.cartRemainingUnits ?? 10))) <= 0;
  }

  get productOutOfStock(): boolean {
    return Math.max(0, Math.floor(Number(this.product?.available ?? 0))) <= 0;
  }

  get isUnavailable(): boolean {
    return this.productOutOfStock || this.cartLimitReached;
  }

  get actionButtonLabel(): string {
    if (this.productOutOfStock) {
      return 'Sin stock disponible';
    }

    if (this.cartLimitReached) {
      return 'Límite de carrito alcanzado';
    }

    return 'Añadir al carrito';
  }

  get confirmButtonLabel(): string {
    if (this.productOutOfStock) {
      return 'Sin stock disponible';
    }

    if (this.cartLimitReached) {
      return 'Límite de carrito alcanzado';
    }

    return 'Agregar al carrito';
  }

  toggleQuantitySelector(): void {
    if (this.productOutOfStock) {
      this.addToCartFeedback.emit({
        message: 'Sin stock disponible',
        type: 'error',
      });
      return;
    }

    if (this.cartLimitReached) {
      this.addToCartFeedback.emit({
        message: 'Límite de carrito alcanzado',
        type: 'error',
      });
      return;
    }

    this.quantitySelectorVisible = !this.quantitySelectorVisible;
    this.quantity = Math.min(Math.max(1, this.quantity), this.maxQuantity);
  }

  increaseQuantity(): void {
    if (this.canIncreaseQuantity) {
      this.quantity += 1;
    }
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const response = error as { error?: { message?: string | string[] }; message?: string };
    const backendMessage = response?.error?.message;

    if (Array.isArray(backendMessage) && backendMessage.length > 0) {
      return String(backendMessage[0]);
    }

    if (typeof backendMessage === 'string' && backendMessage.trim()) {
      return backendMessage;
    }

    if (typeof response?.message === 'string' && response.message.trim()) {
      return response.message;
    }

    return fallback;
  }

  decreaseQuantity(): void {
    if (this.canDecreaseQuantity) {
      this.quantity -= 1;
    }
  }

  async confirmAddToCart(): Promise<void> {
    if (!this.currentUser) {
      this.addToCartFeedback.emit({
        message: 'Debes iniciar sesión para agregar productos al carrito.',
        type: 'error',
      });
      return;
    }

    if (this.productOutOfStock) {
      this.addToCartFeedback.emit({
        message: 'Sin stock disponible',
        type: 'error',
      });
      return;
    }

    if (this.cartLimitReached) {
      this.addToCartFeedback.emit({
        message: 'Límite de carrito alcanzado',
        type: 'error',
      });
      return;
    }

    const quantity = Math.min(Math.max(1, Math.floor(this.quantity)), this.maxQuantity);

    this.quantitySelectorVisible = false;

    try {
      await firstValueFrom(this.cartService.addToCart(this.currentUser, this.product, quantity));
      this.quantity = 1;
      this.addToCartFeedback.emit({
        message: 'Producto añadido exitosamente.',
        type: 'success',
      });
    } catch (error) {
      this.addToCartFeedback.emit({
        message: this.getErrorMessage(
          error,
          'No se pudo agregar el producto al carrito.',
        ),
        type: 'error',
      });
    }
  }
}
