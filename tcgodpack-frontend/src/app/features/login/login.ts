import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common'; // Asegúrate de tener CommonModule si usas directivas básicas

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        // 1. Guardamos el token en el localStorage como ya lo hacías
        localStorage.setItem('token', response.token);
        
        // 2. Evaluamos el rol ('role') que añadimos en la respuesta de tu NestJS
        if (response.role === 'admin') {
          // Si es el administrador único, lo mandamos a la nueva ruta separada
          this.router.navigate(['/admin-dashboard']);
        } else {
          // Si es un cliente común, va al catálogo tradicional
          this.router.navigate(['/catalog']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Usuario o contraseña incorrectos';
      }
    });
  }
}
