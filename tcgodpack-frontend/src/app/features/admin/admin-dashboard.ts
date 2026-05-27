import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service'; // Asegura importar la interfaz Product
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Para tipar el error correctamente

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

  // Tipamos el objeto carta estructuralmente en base a la interfaz Product de tu servicio
  carta: Product = {
    name: '',
    number: 0,       // Cambiado de null a 0 por coherencia de tipo primitivo
    price: 0,
    available: 0,
    imageUrl: ''
  };

  successAlert = '';
  errorAlert = '';

  guardarCarta(): void {
    this.successAlert = '';
    this.errorAlert = '';

    // 🛠️ Eliminamos el "as any" ya que 'carta' ahora cumple perfectamente con el tipo 'Product'
    this.productService.createProduct(this.carta).subscribe({
      next: (res: Product) => { // 🛠️ Tipamos la respuesta limpia (Soluciona TS7006 de 'res')
        this.successAlert = `✅ ¡${res.name} añadida exitosamente al stock con ID ${res.number}!`;
        setTimeout(() => this.router.navigate(['/catalog']), 1500);
      },
      error: (err: HttpErrorResponse) => { // 🛠️ Tipamos el error de manera estricta (Soluciona TS7006 de 'err')
        this.errorAlert = err.error?.message || 'Error de conexión con el servidor.';
      }
    });
  }
}