import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

export interface ApiGroupSummary {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadorId: string;
  creadoEn: string;
  creadorUsername: string | null;
  creadorEmail: string | null;
  creadorNombreCompleto: string | null;
  membersCount: string | number;
  assignedPermissionsCount: string | number;
}

export interface ApiGroupMember {
  groupId: string;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  joinedAt: string;
  permissions: string[];
}

export interface ApiGroupDetail {
  id: string;
  nombre: string;
  descripcion: string | null;
  creadorId: string;
  creadoEn: string;
  creador: {
    username: string | null;
    email: string | null;
    nombreCompleto: string | null;
  };
  members: ApiGroupMember[];
}

export interface CreateGroupPayload {
  nombre: string;
  descripcion?: string;
  creadorId: string;
}

export interface UpdateGroupPayload {
  nombre?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GroupApiService {
  private readonly apiUrl = 'http://localhost:4000/api/groups';

  constructor(private http: HttpClient) {}

  listGroups(params: { memberUserId?: string } = {}): Observable<ApiResponse<ApiGroupSummary[]>> {
    return this.http.get<ApiResponse<ApiGroupSummary[]>>(this.apiUrl, {
      params: Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
      ),
    });
  }

  getGroup(groupId: string): Observable<ApiResponse<ApiGroupDetail>> {
    return this.http.get<ApiResponse<ApiGroupDetail>>(`${this.apiUrl}/${groupId}`);
  }

  createGroup(payload: CreateGroupPayload): Observable<ApiResponse<ApiGroupDetail>> {
    return this.http.post<ApiResponse<ApiGroupDetail>>(this.apiUrl, payload);
  }

  updateGroup(
    groupId: string,
    payload: UpdateGroupPayload
  ): Observable<ApiResponse<ApiGroupDetail>> {
    return this.http.patch<ApiResponse<ApiGroupDetail>>(`${this.apiUrl}/${groupId}`, payload);
  }

  deleteGroup(groupId: string): Observable<ApiResponse<{ id: string; deleted: boolean }>> {
    return this.http.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `${this.apiUrl}/${groupId}`
    );
  }

  listMembers(groupId: string): Observable<ApiResponse<ApiGroupMember[]>> {
    return this.http.get<ApiResponse<ApiGroupMember[]>>(`${this.apiUrl}/${groupId}/members`);
  }

  addMember(
    groupId: string,
    payload: { userId: string; permissions: string[] }
  ): Observable<ApiResponse<{ groupId: string; userId: string; username: string; permissions: string[] }>> {
    return this.http.post<
      ApiResponse<{ groupId: string; userId: string; username: string; permissions: string[] }>
    >(`${this.apiUrl}/${groupId}/members`, payload);
  }

  updateMemberPermissions(
    groupId: string,
    userId: string,
    permissions: string[]
  ): Observable<ApiResponse<{ groupId: string; userId: string; permissions: string[] }>> {
    return this.http.patch<
      ApiResponse<{ groupId: string; userId: string; permissions: string[] }>
    >(`${this.apiUrl}/${groupId}/members/${userId}/permissions`, { permissions });
  }

  removeMember(
    groupId: string,
    userId: string
  ): Observable<ApiResponse<{ groupId: string; userId: string; deleted: boolean }>> {
    return this.http.delete<
      ApiResponse<{ groupId: string; userId: string; deleted: boolean }>
    >(`${this.apiUrl}/${groupId}/members/${userId}`);
  }

  listPermissionCatalog(): Observable<ApiResponse<{ id: string; nombre: string }[]>> {
    return this.http.get<ApiResponse<{ id: string; nombre: string }[]>>(
      `${this.apiUrl}/permissions/catalog`
    );
  }
}
