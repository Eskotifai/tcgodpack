import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

export class Review {
  constructor(
    public productName: string,
    public email: string,
    public comment: string,
    public rating: number,
  ) {}
}

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './review-form-page.html',
  styleUrls: ['./review-form-page.css']
})
export class ProductReviewsComponent implements OnInit {
  private readonly apiUrl = 'http://localhost:3000/reviews';
  private readonly profileUrl = 'http://localhost:3000/profile';

  reviews: Review[] = [];
  currentProductName: string = '';
  loading: boolean = false;
  reviewsLoaded: boolean = false;
  submitting: boolean = false;
  currentUserEmail: string | null = null;
  canWriteReview: boolean = false;
  reviewLoadError: string | null = null;
  hasAlreadyReviewed: boolean = false;

  newReview: Review = new Review(this.currentProductName, '', '', 3);

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserEmail = this.authService.getCurrentUser();
    if (this.currentUserEmail) {
      this.newReview.email = this.currentUserEmail;
    }

    this.route.queryParamMap.subscribe((params) => {
      const productFromQuery = params.get('productName')?.trim();
      if (productFromQuery) {
        this.handleProductReviewRoute(productFromQuery);
      } else {
        this.currentProductName = '';
        this.reviews = [];
        this.loading = false;
        this.canWriteReview = false;
        this.reviewLoadError = 'No se ha recibido el nombre del producto.';
      }
    });
  }

  private handleProductReviewRoute(productName: string): void {
    this.currentProductName = productName;
    this.newReview.productName = productName;
    this.reviewLoadError = null;
    this.reviewsLoaded = false;
    this.loadReviewsForProduct(productName);
    this.updateReviewEligibility();
  }

  private updateReviewEligibility(): void {
    this.canWriteReview = false;

    if (!this.currentUserEmail || !this.currentProductName) {
      return;
    }

    this.http
      .get<any>(`${this.profileUrl}?email=${encodeURIComponent(this.currentUserEmail)}`)
      .subscribe({
        next: (profile) => {
          // Engañamos a Angular con setTimeout para evitar NG0100
          setTimeout(() => {
            const purchased: string[] = Array.isArray(profile.purchasedProducts)
              ? profile.purchasedProducts.map((p: any) => String(p).toLowerCase())
              : [];
            this.canWriteReview = purchased.includes(this.currentProductName.toLowerCase());
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.canWriteReview = false;
        }
      });
  }

  private loadReviewsForProduct(productName: string): void {
    this.reviewLoadError = null;
    this.loading = true;
    this.reviewsLoaded = false;
    this.reviews = [];
    const url = `${this.apiUrl}/by-product?productName=${encodeURIComponent(productName)}`;

    this.http.get<Review[]>(url).subscribe({
      next: (data) => {
        this.reviews = Array.isArray(data) ? data : [];
        this.reviewLoadError = null;
        this.loading = false;
        this.reviewsLoaded = true;
        this.cdr.detectChanges();

        if (this.currentUserEmail) {
          // El setTimeout asegura que esta evaluación sea en el próximo ciclo
          setTimeout(() => {
            this.hasAlreadyReviewed = this.reviews.some(
              r => r.email.toLowerCase() === this.currentUserEmail!.toLowerCase()
            );
            this.cdr.detectChanges();
          });
        }
      },
      error: (err) => {
        console.error('Error al descargar opiniones:', err);
        this.reviewLoadError = 'No se pudieron cargar las reseñas.';
        this.loading = false;
        this.reviewsLoaded = true;
        this.cdr.detectChanges();
      }
    });
  }

  fetchReviews(): void {
    this.loadReviewsForProduct(this.currentProductName);
  }

  onSubmitReview(): void {
    if (!this.currentUserEmail || !this.currentProductName) {
      alert('Debes iniciar sesión y seleccionar un producto para enviar una reseña.');
      return;
    }

    if (!this.newReview.comment || !this.newReview.rating) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    if (!this.canWriteReview) {
      alert('Solo puedes escribir reseñas de productos que hayas comprado.');
      return;
    }

    this.submitting = true;
    this.newReview.productName = this.currentProductName;
    this.newReview.email = this.currentUserEmail;

    this.http.post<Review>(this.apiUrl, this.newReview).subscribe({
      next: (createdReview) => {
        this.reviews = [...this.reviews, createdReview];
        this.newReview = new Review(this.currentProductName, this.currentUserEmail!, '', 3);
        this.submitting = false;
        this.hasAlreadyReviewed = true;
        this.cdr.detectChanges();
        alert('¡Gracias! Tu reseña ha sido añadida con éxito.');
      },
      error: (err) => {
        console.error('Error al registrar tu reseña:', err);
        this.submitting = false;
        this.cdr.detectChanges();
        alert('Hubo un inconveniente procesando tu comentario. Intenta de nuevo.');
      }
    });
  }

  openCatalog(): void {
    this.router.navigate(['/catalog']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}