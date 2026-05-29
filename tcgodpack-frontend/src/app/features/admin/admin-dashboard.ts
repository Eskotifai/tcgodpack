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

  // 🛠️ Expandido: Añadimos 'consultar' al control de estado
  vistaActiva: 'menu' | 'agregar' | 'confirmacion' | 'consultar' = 'menu';

  // 🛠️ Guardará la colección de cartas recuperadas del backend
  listaProductos: Product[] = [];

  carta: Product = {
    name: '',
    number: 0,   
    price: 0,
    available: 0,
    imageUrl: ''
  };

  errorAlert = '';

  cambiarVista(vista: 'menu' | 'agregar' | 'confirmacion' | 'consultar'): void {
    this.vistaActiva = vista;
    this.errorAlert = '';
    
    if (vista === 'agregar') {
      this.carta = { name: '', number: 0, price: 0, available: 0, imageUrl: '' };
    }
  }

  
  cargarYConsultarProductos(): void {
    this.errorAlert = '';
    
    
    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.listaProductos = products;
        this.cambiarVista('consultar');
      },
      error: (err: HttpErrorResponse) => {
        this.errorAlert = err.error?.message || 'No se pudo cargar la lista de productos del servidor.';
      }
    });
  }

  guardarCarta(): void {
    this.errorAlert = '';

    this.productService.createProduct(this.carta).subscribe({
      next: (res: Product) => { 
        this.cambiarVista('confirmacion');
      },
      error: (err: HttpErrorResponse) => { 
        this.errorAlert = err.error?.message || 'Error de conexión con el servidor.';
      }
    });
  }

  irAlLogin(): void {
  this.router.navigate(['/login']);
}
}