import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

interface Product {
  name: string;
  number: number;
  price: number;
  available: number;
  imageUrl: string;
}

@Component({
  selector: 'app-catalog-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog-list-page.html',
  styleUrl: './catalog-list-page.css',
})
export class CatalogListPage implements OnInit {
  products = signal<Product[]>([]);
  currentUser = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService,
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
  }

  trackByNumber(index: number, item: Product) {
    return item.number;
  }

  openCart(): void {
    this.router.navigate(['/cart']);
  }
}
