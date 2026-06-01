import { Component, OnInit, signal, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { CartService } from '../../../../services/cart.service';
import { ProductCard, ProductCardFeedbackType } from '../../../../shared/components/product-card/product-card';
import { Product } from '../../../../shared/interfaces/product';
import { Cart } from '../../../../shared/interfaces/cart';

@Component({
  selector: 'app-catalog-list-page',
  standalone: true,
  imports: [CommonModule, ProductCard],
  templateUrl: './catalog-list-page.html',
  styleUrl: './catalog-list-page.css',
})
export class CatalogListPage implements OnInit {
  products = signal<Product[]>([]);
  currentUser = signal<string | null>(null);
  cartRemainingUnits = signal(10);
  feedbackMessage = signal<string | null>(null);
  feedbackType = signal<ProductCardFeedbackType | null>(null);
  feedbackVisible = signal(false);
  private feedbackHideTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private feedbackClearTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());

    this.http.get<Product[]>('http://localhost:3000/products').subscribe({
      next: (data) => {
        this.products.set(data);
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
      }
    });

    this.refreshCartRemainingUnits();
  }

  private refreshCartRemainingUnits(): void {
    const user = this.currentUser();
    if (!user) {
      this.cartRemainingUnits.set(10);
      return;
    }

    this.cartService.getCart(user).subscribe({
      next: (cart: Cart) => {
        const totalUnits = (cart.products ?? []).reduce(
          (sum, item) => sum + Math.max(0, Math.floor(Number(item.quantity ?? 0))),
          0,
        );
        this.cartRemainingUnits.set(Math.max(0, 10 - totalUnits));
      },
      error: () => {
        this.cartRemainingUnits.set(10);
      },
    });
  }

  trackByNumber(index: number, item: Product) {
    return item.number;
  }

  handleProductFeedback(message: string, type: ProductCardFeedbackType): void {
    if (this.feedbackHideTimeoutId !== null) {
      clearTimeout(this.feedbackHideTimeoutId);
      this.feedbackHideTimeoutId = null;
    }

    if (this.feedbackClearTimeoutId !== null) {
      clearTimeout(this.feedbackClearTimeoutId);
      this.feedbackClearTimeoutId = null;
    }

    this.feedbackMessage.set(message);
    this.feedbackType.set(type);
    this.feedbackVisible.set(false);

    setTimeout(() => {
      this.feedbackVisible.set(true);
    }, 20);

    this.feedbackHideTimeoutId = setTimeout(() => {
      this.feedbackVisible.set(false);
      this.feedbackHideTimeoutId = null;
    }, 2200);

    this.feedbackClearTimeoutId = setTimeout(() => {
      this.feedbackMessage.set(null);
      this.feedbackType.set(null);
      this.feedbackClearTimeoutId = null;
    }, 2700);

    if (type === 'success') {
      this.refreshCartRemainingUnits();
    }
  }
  navegarAResenas(productName: string): void {
    this.router.navigate(['/review'], { 
      queryParams: { productName: productName } 
    });
  }

  openCart(): void {
    this.router.navigate(['/cart']);
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
