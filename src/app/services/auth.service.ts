import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppPermission, LoggedUser } from './permission.service';
import { BrowserStorageService } from './browser-storage.service';

export interface LoginRequest {
  user: string;
  password: string;
}

export interface RegisterRequest {
  nombre_completo: string;
  username: string;
  email: string;
  password: string;
  direccion?: string;
  telefono?: string;
  fecha_inicio?: string;
}

/* ESQUEMA UNIVERSAL */
export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

/* USUARIO QUE REGRESA EL BACKEND */
export interface LoginUser {
  id: string;
  nombre_completo: string;
  username: string;
  email: string;
  permisos: AppPermission[];
}

/* DATA REAL DENTRO DE "data" */
export interface LoginData {
  user: LoginUser;
  token: string;
}

export interface RegisterUser {
  id: string;
  nombre_completo: string;
  direccion?: string | null;
  telefono?: string | null;
  fecha_inicio?: string | null;
  username: string;
  email: string;
  activo: boolean;
  permisos: AppPermission[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:4000/api/auth';

  constructor(
    private http: HttpClient,
    private storage: BrowserStorageService
  ) {}

  login(data: LoginRequest): Observable<ApiResponse<LoginData>> {
    return this.http.post<ApiResponse<LoginData>>(`${this.apiUrl}/login`, data).pipe(
      tap((response) => {
        if (response.statusCode !== 200 || !response.data) {
          console.error('Error en login:', response);
          return;
        }

        const userData = response.data.user;
        const token = response.data.token;

        const loggedUser: LoggedUser = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          permissions: userData.permisos || [],
          token: token || ''
        };

        this.storage.setItem('loggedUser', JSON.stringify(loggedUser));

        if (token) {
          this.storage.setItem('token', token);
        } else {
          this.storage.removeItem('token');
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<RegisterUser>> {
    return this.http.post<ApiResponse<RegisterUser>>(`${this.apiUrl}/register`, data);
  }

  logout(): void {
    this.storage.removeItem('loggedUser');
    this.storage.removeItem('token');
    this.storage.removeItem('currentGroup');
    this.storage.removeItem('activeGroupId');
    this.storage.removeItem('activeGroupPermissions');
  }

  getUser(): LoggedUser | null {
    const data = this.storage.getItem('loggedUser');
    if (!data) return null;

    try {
      return JSON.parse(data) as LoggedUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }

  getToken(): string | null {
    return this.storage.getItem('token');
  }

  hasPermission(permission: AppPermission): boolean {
    const user = this.getUser();
    return !!user?.permissions?.includes(permission);
  }
}
