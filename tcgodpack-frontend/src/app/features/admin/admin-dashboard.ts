import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product-api-service'; 
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

  // 🛠️ Expandido: Añadimos 'error' al control de estados de la UI
  vistaActiva: 'menu' | 'agregar' | 'confirmacion' | 'consultar' | 'error' = 'menu';

  listaProductos: Product[] = [];

  carta: Product = {
    name: '',
    number: 0,   
    price: 0,
    available: 0,
    imageUrl: ''
  };

  errorAlert = '';

  cambiarVista(vista: 'menu' | 'agregar' | 'confirmacion' | 'consultar' | 'error'): void {
    this.vistaActiva = vista;
    
    // Solo blanqueamos el modelo si el usuario va explícitamente a ingresar un producto nuevo desde cero
    if (vista === 'agregar') {
      this.errorAlert = '';
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
        this.vistaActiva = 'error'; // También redirige aquí si falla la carga del inventario
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
        console.error('Error completo recibido:', err); // Para que sigas teniendo el rastro en consola

        //  Extracción robusta del mensaje de error
        if (err.error && typeof err.error === 'object') {
          // NestJS suele devolver { statusCode: 400, message: "..." o ["..."], error: "Bad Request" }
          if (Array.isArray(err.error.message)) {
            this.errorAlert = err.error.message.join(', ');
          } else if (err.error.message) {
            this.errorAlert = err.error.message;
          } else {
            this.errorAlert = err.message || 'Error interno del servidor.';
          }
        } else if (typeof err.error === 'string') {
          this.errorAlert = err.error;
        } else {
          this.errorAlert = err.statusText || 'Error inesperado de conexión.';
        }

        this.vistaActiva = 'error';
      }
    });
  }

  // 🛠️ NUEVO MÉTODO: Permite volver a la pantalla de edición sin vaciar los inputs del formulario
  confirmarYRegresar(): void {
    this.vistaActiva = 'agregar';
    this.errorAlert = '';
  }

  irAlLogin(): void {
    this.router.navigate(['/login']);
  }
}