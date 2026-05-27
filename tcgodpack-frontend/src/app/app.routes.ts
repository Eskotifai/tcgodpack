// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { SignupComponent } from './features/signup/signup';
import { CatalogListPage } from './features/catalog/pages/catalog-list-page/catalog-list-page';
// 1. Importamos el nuevo componente del admin y su guard de protección
import { AdminDashboardComponent } from './features/admin/admin-dashboard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'catalog', component: CatalogListPage },
  
  // 2. Agregamos la ruta del panel de administración protegida por el guard
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [adminGuard] 
  },
  
  { path: '**', redirectTo: 'login' },
];