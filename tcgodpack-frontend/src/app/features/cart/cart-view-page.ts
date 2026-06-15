import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/profile-api-service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Product } from '../../services/product-api-service';
import { CartService } from '../../services/cart-api-service';

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
  readonly maxUnitsInCart = 10;
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
    // private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
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
    this.cartService.getCart(user)
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

  getTotalUnits(cart: Cart | null = this.cart): number {
    return Array.isArray(cart?.products)
      ? (cart?.products ?? []).reduce((sum, item) => sum + Math.max(0, Math.floor(Number(item.quantity ?? 0))), 0)
      : 0;
  }

  private confirmRemoval(productName: string, willRemoveItem: boolean): boolean {
    const message = willRemoveItem
      ? `La cantidad de ${productName} llegará a 0 y se eliminará del carrito. ¿Quieres continuar?`
      : `¿Quieres eliminar ${productName} del carrito?`;

    return window.confirm(message);
  }

  removeProductFromCart(item: CartProduct): void {
    const user = this.authService.getCurrentUser();
    if (!user || this.loading) {
      return;
    }

    if (!this.confirmRemoval(item.product.name, false)) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.cartService.removeFromCart(user, item.product.number).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        this.recalculateTotals(updatedCart);
        this.loading = false;
        this.showToast(`Se eliminó ${item.product.name} del carrito.`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'No se pudo eliminar el producto del carrito.');
        this.showToast(this.error, 'error');
        this.cdr.detectChanges();
      },
    });
  }

  changeProductQuantity(item: CartProduct, delta: number): void {
    const user = this.authService.getCurrentUser();
    if (!user || this.loading || delta === 0) {
      return;
    }

    const currentQuantity = Math.max(0, Math.floor(Number(item.quantity ?? 0)));
    const newQuantity = currentQuantity + Math.trunc(delta);

    if (newQuantity <= 0 && !this.confirmRemoval(item.product.name, true)) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.cartService.adjustCartItemQuantity(user, item.product.number, delta).subscribe({
      next: (updatedCart) => {
        this.cart = updatedCart;
        this.recalculateTotals(updatedCart);
        this.loading = false;

        const actionText = delta > 0 ? 'aumentó' : 'disminuyó';
        this.showToast(`Se ${actionText} la cantidad de ${item.product.name}.`, 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.getErrorMessage(err, 'No se pudo actualizar la cantidad del producto.');
        this.showToast(this.error, 'error');
        this.cdr.detectChanges();
      },
    });
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

    this.cartService.checkoutCart(user).subscribe({
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
