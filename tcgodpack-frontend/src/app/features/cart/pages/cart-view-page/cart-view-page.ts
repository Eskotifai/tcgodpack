import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/profile-api-service';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Product } from '../../../../services/product-api-service';

interface CartProduct {
  product: Product;
  quantity: number;
}

interface Cart {
  email: string;
  products?: CartProduct[];
}

@Component({
  selector: 'app-cart-view-page',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './cart-view-page.html',
  styleUrl: './cart-view-page.css',
})
export class CartViewPage implements OnInit {
  cart: Cart | null = null;
  total = 0;
  subtotal = 0;
  taxRate = 0.16; // 16% IVA
  iva = 0;
  shippingCost = 0;
  grandTotal = 0;
  loading = false;
  checkoutLoading = false;
  error: string | null = null;
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | null = null;
  toastVisible = false;
  private toastShowTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private toastHideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private toastClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    if (this.toastShowTimeoutId !== null) {
      clearTimeout(this.toastShowTimeoutId);
      this.toastShowTimeoutId = null;
    }

    if (this.toastHideTimeoutId !== null) {
      clearTimeout(this.toastHideTimeoutId);
      this.toastHideTimeoutId = null;
    }

    if (this.toastClearTimeoutId !== null) {
      clearTimeout(this.toastClearTimeoutId);
      this.toastClearTimeoutId = null;
    }
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();
    this.http
      .get<Cart>(`http://localhost:3000/cart?email=${encodeURIComponent(user)}`)
      .subscribe({
        next: (c) => {
          this.cart = c;
          this.loading = false;
          try {
            const products = Array.isArray(c.products) ? c.products : [];
            this.subtotal = products.reduce(
              (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
              0,
            );
            this.iva = +(this.subtotal * this.taxRate).toFixed(2);
            // Envío básico: gratis sobre $50, sino $5
            this.shippingCost = this.subtotal > 50 ? 0 : 5;
            this.grandTotal = +(this.subtotal + this.iva + this.shippingCost).toFixed(2);
            this.total = this.grandTotal;
          } catch (err) {
            console.error('Error calculando el total del carrito:', err);
            this.subtotal = this.iva = this.shippingCost = this.grandTotal = this.total = 0;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Error al cargar el carrito.';
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
        },
        complete: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  trackByProductNumber(index: number, item: CartProduct): number {
    return item.product.number;
  }

  private recalculateTotals(cart: Cart | null): void {
    const products = Array.isArray(cart?.products) ? cart?.products ?? [] : [];
    this.subtotal = products.reduce(
      (sum, item) => sum + (item.product?.price ?? 0) * (item.quantity ?? 0),
      0,
    );
    this.iva = +(this.subtotal * this.taxRate).toFixed(2);
    this.shippingCost = this.subtotal > 50 ? 0 : 5;
    this.grandTotal = +(this.subtotal + this.iva + this.shippingCost).toFixed(2);
    this.total = this.grandTotal;
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

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastHideTimeoutId !== null) {
      clearTimeout(this.toastHideTimeoutId);
      this.toastHideTimeoutId = null;
    }

    if (this.toastClearTimeoutId !== null) {
      clearTimeout(this.toastClearTimeoutId);
      this.toastClearTimeoutId = null;
    }

    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = false;

    this.toastShowTimeoutId = setTimeout(() => {
      this.toastVisible = true;
      this.toastShowTimeoutId = null;
      this.cdr.detectChanges();
    }, 20);

    this.toastHideTimeoutId = setTimeout(() => {
      this.toastVisible = false;
      this.toastHideTimeoutId = null;
      this.cdr.detectChanges();
    }, 2400);

    this.toastClearTimeoutId = setTimeout(() => {
      this.toastMessage = null;
      this.toastType = null;
      this.toastClearTimeoutId = null;
      this.cdr.detectChanges();
    }, 2900);
  }

  proceedToCheckout(): void {
    const user = this.authService.getCurrentUser();
    if (!user || this.checkoutLoading || this.loading || !this.cart || (this.cart.products?.length ?? 0) === 0) {
      return;
    }

    this.checkoutLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.http.post<Cart>('http://localhost:3000/cart/checkout', { email: user }).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        this.recalculateTotals(updatedCart);
        this.checkoutLoading = false;
        this.showToast('Compra realizada con éxito.', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.checkoutLoading = false;
        this.showToast(
          this.getErrorMessage(
            err,
            'La cantidad de unidades seleccionadas supera el espacio actual del carrito',
          ),
          'error',
        );
        this.cdr.detectChanges();
      },
    });
  }
}
