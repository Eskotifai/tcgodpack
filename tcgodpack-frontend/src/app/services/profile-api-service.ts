import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';


  login(credentials: { email: string; password: string }): Observable<{ token: string; role: string }> {
    return this.http.post<{ token: string; role: string }>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        
        localStorage.setItem('currentUser', credentials.email);
        localStorage.setItem('token', response.token);
        localStorage.setItem('role', response.role);
      })
    );
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('currentUser');
  }

  getUserRole(): string | null {
    return localStorage.getItem('role');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('role');
  }

  signUp(profile: {
    email: string;
    password: string;
    name: string;
    lastName: string;
    role: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/profile/register`, profile);
  }
}