// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login';
import { SignupComponent } from './features/signup/signup';
import { CatalogListPage } from './features/catalog/catalog-list-page';
import { CartViewPage } from './features/cart/cart-view-page';
import { AdminDashboardComponent } from './features/admin/admin-dashboard';
import { adminGuard } from './core/guards/admin.guard';
import { ProductReviewsComponent } from './features/review/review-form-page';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'catalog', component: CatalogListPage },
  { path: 'cart', component: CartViewPage },
  { path: 'review', component: ProductReviewsComponent },
  
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent, 
    canActivate: [adminGuard] 
  },
  
  { path: '**', redirectTo: 'login' },
];