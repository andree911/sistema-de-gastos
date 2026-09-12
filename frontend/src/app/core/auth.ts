import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.config';

export interface RegisterRequest {
  nome: string;
  email: string;
  senha: string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface AuthResponse {
  token: string;
  nome: string;
  email: string;
}

@Service()
export class Auth {
  private http = inject(HttpClient);

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, request).pipe(
      tap(response => this.salvarSessao(response))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, request).pipe(
      tap(response => this.salvarSessao(response))
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  get estaLogado(): boolean {
    return !!this.token;
  }

  private salvarSessao(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('nome', response.nome);
  }
}