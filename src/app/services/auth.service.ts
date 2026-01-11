import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/task';

  constructor(private http: HttpClient) {}

  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/registerUser`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.status === '200' && response.data?.token) {
          this.setSession(response.data);
        }
      })
    );
  }

  private setSession(authResult: any): void {
    localStorage.setItem('id_token', authResult.token);
    localStorage.setItem('username', authResult.username);
  }

  logout(): void {
    localStorage.removeItem('id_token');
    localStorage.removeItem('username');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('id_token');
  }

  getToken(): string | null {
    return localStorage.getItem('id_token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }
}
