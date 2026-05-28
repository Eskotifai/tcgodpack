// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { SignupComponent } from './features/signup/signup';
import { CatalogListPage } from './features/catalog/pages/catalog-list-page/catalog-list-page';
import { AdminDashboardComponent } from './features/admin/admin-dashboard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'catalog', component: CatalogListPage },
  
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [adminGuard] 
  },
  
  { path: '**', redirectTo: 'login' },
];