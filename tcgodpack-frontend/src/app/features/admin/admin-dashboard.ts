import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service'; 
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; 

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  
  carta: Product = {
    name: '',
    number: 0,   
    price: 0,
    available: 0,
    imageUrl: ''
  };

  successAlert = '';
  errorAlert = '';

  guardarCarta(): void {
    this.successAlert = '';
    this.errorAlert = '';

    this.productService.createProduct(this.carta).subscribe({
      next: (res: Product) => { 
        this.successAlert = `✅ ¡${res.name} añadida exitosamente al stock con ID ${res.number}!`;
        setTimeout(() => this.router.navigate(['/catalog']), 1500);
      },
      error: (err: HttpErrorResponse) => { 
        this.errorAlert = err.error?.message || 'Error de conexión con el servidor.';
      }
    });
  }
}