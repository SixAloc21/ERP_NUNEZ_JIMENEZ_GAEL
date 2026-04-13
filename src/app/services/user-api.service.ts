import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

export interface ApiPermissionItem {
  id: string;
  nombre: string;
  descripcion?: string | null;
  creado_en?: string;
}

export interface ApiUser {
  id: string;
  nombre_completo: string;
  direccion: string | null;
  telefono: string | null;
  fecha_inicio: string | null;
  last_login: string | null;
  username: string;
  email: string;
  activo: boolean;
  permisos: string[];
}

export interface SaveUserPayload {
  nombre_completo: string;
  username: string;
  email: string;
  password?: string;
  direccion?: string;
  telefono?: string;
  fecha_inicio?: string;
  activo?: boolean;
}

export interface UpdateCurrentUserPayload {
  nombre_completo?: string;
  username?: string;
  email?: string;
  password?: string;
  direccion?: string;
  telefono?: string;
  fecha_inicio?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly apiUrl = 'http://localhost:4000/api/users';

  constructor(private http: HttpClient) {}

  listUsers(): Observable<ApiResponse<ApiUser[]>> {
    return this.http.get<ApiResponse<ApiUser[]>>(this.apiUrl);
  }

  getMe(): Observable<ApiResponse<ApiUser>> {
    return this.http.get<ApiResponse<ApiUser>>(`${this.apiUrl}/me`);
  }

  createUser(payload: SaveUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.http.post<ApiResponse<ApiUser>>(this.apiUrl, payload);
  }

  updateUser(userId: string, payload: SaveUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.http.patch<ApiResponse<ApiUser>>(`${this.apiUrl}/${userId}`, payload);
  }

  updateMe(payload: UpdateCurrentUserPayload): Observable<ApiResponse<ApiUser>> {
    return this.http.patch<ApiResponse<ApiUser>>(`${this.apiUrl}/me`, payload);
  }

  deleteUser(userId: string): Observable<ApiResponse<{ id: string; deleted: boolean }>> {
    return this.http.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `${this.apiUrl}/${userId}`
    );
  }

  listGlobalPermissions(): Observable<ApiResponse<ApiPermissionItem[]>> {
    return this.http.get<ApiResponse<ApiPermissionItem[]>>(
      `${this.apiUrl}/global-permissions/catalog`
    );
  }

  updateGlobalPermissions(
    userId: string,
    permissions: string[]
  ): Observable<ApiResponse<ApiUser>> {
    return this.http.patch<ApiResponse<ApiUser>>(
      `${this.apiUrl}/${userId}/global-permissions`,
      { permissions }
    );
  }
}
