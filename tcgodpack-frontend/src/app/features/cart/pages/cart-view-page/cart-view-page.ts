import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Product } from '../../../../services/product.service';

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
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

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
}
