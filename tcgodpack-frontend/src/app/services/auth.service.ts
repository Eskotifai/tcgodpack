import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000';

  login(credentials: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap(() => {
        localStorage.setItem('currentUser', credentials.email);
      })
    );
  }

  getCurrentUser(): string | null {
    return localStorage.getItem('currentUser');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }

  signUp(profile: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/profile/register`, profile);
  }
}
