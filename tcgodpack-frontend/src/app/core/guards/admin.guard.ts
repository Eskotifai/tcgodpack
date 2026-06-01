import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

// 🛠️ Asegúrate de que empiece exactamente con "export const"
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getUserRole() === 'admin') {
    return true;
  }

  router.navigate(['/catalog']);
  return false;
};