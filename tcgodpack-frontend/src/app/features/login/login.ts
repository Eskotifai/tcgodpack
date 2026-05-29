import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 🌟 CRUCIAL: Debe estar importado aquí
import { Router, RouterLink } from '@angular/router'; // 🌟 CRUCIAL: Ambos imports para la navegación
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // 🌟 Se inyectan en la plantilla standalone
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  // Manejo exclusivo por email descartando el username por completo
  credentials = { email: '', password: '' };
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        // Almacenamos el token devuelto
        localStorage.setItem('token', response.token);
        
        // Redirección inteligente basada en el rol de la base de datos
        if (response.role === 'admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/catalog']);
        }
      },
      error: (err) => {
        // Captura el mensaje exacto enviado desde el backend de NestJS
        this.errorMessage = err.error?.message || 'Usuario o contraseña incorrectos';
      }
    });
  }
}