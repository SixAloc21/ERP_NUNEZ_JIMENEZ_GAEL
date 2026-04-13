import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

export interface ApiTicketListItem {
  id: string;
  groupId: string;
  groupName: string;
  titulo: string;
  descripcion: string | null;
  authorId: string;
  authorUsername: string;
  authorEmail: string;
  authorFullName: string;
  assignedId: string | null;
  assignedUsername: string | null;
  assignedEmail: string | null;
  assignedFullName: string | null;
  statusId: string;
  statusName: string;
  statusColor: string;
  priorityId: string;
  priorityName: string;
  priorityOrder: number;
  createdAt: string;
  fechaFinal: string | null;
  commentsCount: string | number;
}

export interface ApiTicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorUsername: string;
  authorEmail: string;
  authorFullName: string;
  contenido: string;
  createdAt: string;
}

export interface ApiTicketHistory {
  id: string;
  ticketId: string;
  userId: string | null;
  username: string | null;
  email: string | null;
  fullName: string | null;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export interface ApiTicketDetail extends ApiTicketListItem {
  comments: ApiTicketComment[];
  history: ApiTicketHistory[];
}

export interface TicketListResponse {
  items: ApiTicketListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  sorting: {
    sortBy: string;
    sortDir: 'asc' | 'desc';
  };
}

export interface TicketStatsResponse {
  summary: {
    total: number;
  };
  byStatus: Array<{
    id: string;
    nombre: string;
    color: string;
    total: number;
  }>;
  byPriority: Array<{
    id: string;
    nombre: string;
    orden: number;
    total: number;
  }>;
  byGroup: Array<{
    id: string;
    nombre: string;
    total: number;
  }>;
  byAssigned: Array<{
    id: string | null;
    nombre: string;
    total: number;
  }>;
}

export interface ApiTicketStatus {
  id: string;
  nombre: string;
  color: string;
}

export interface ApiTicketPriority {
  id: string;
  nombre: string;
  orden: number;
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  groupId?: string;
  assignedUserId?: string;
  authorId?: string;
  estadoId?: string;
  estadoNombre?: string;
  prioridadId?: string;
  prioridadNombre?: string;
  search?: string;
}

export interface SaveTicketPayload {
  groupId: string;
  titulo: string;
  descripcion?: string | null;
  autorId: string;
  asignadoId?: string | null;
  estadoId?: string;
  estadoNombre?: string;
  prioridadId?: string;
  prioridadNombre?: string;
  fechaFinal?: string | null;
}

export interface UpdateTicketPayload {
  titulo?: string;
  descripcion?: string | null;
  asignadoId?: string | null;
  prioridadId?: string;
  prioridadNombre?: string;
  fechaFinal?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TicketApiService {
  private readonly apiUrl = 'http://localhost:4000/api/tickets';

  constructor(private http: HttpClient) {}

  listTickets(
    params: ListTicketsParams
  ): Observable<ApiResponse<TicketListResponse>> {
    return this.http.get<ApiResponse<TicketListResponse>>(this.apiUrl, {
      params: Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
      ),
    });
  }

  getTicket(ticketId: string): Observable<ApiResponse<ApiTicketDetail>> {
    return this.http.get<ApiResponse<ApiTicketDetail>>(`${this.apiUrl}/${ticketId}`);
  }

  createTicket(payload: SaveTicketPayload): Observable<ApiResponse<ApiTicketDetail>> {
    return this.http.post<ApiResponse<ApiTicketDetail>>(this.apiUrl, payload);
  }

  updateTicket(
    ticketId: string,
    payload: UpdateTicketPayload
  ): Observable<ApiResponse<ApiTicketDetail>> {
    return this.http.patch<ApiResponse<ApiTicketDetail>>(`${this.apiUrl}/${ticketId}`, payload);
  }

  updateTicketStatus(
    ticketId: string,
    payload: { performedByUserId: string; estadoId?: string; estadoNombre?: string }
  ): Observable<ApiResponse<ApiTicketDetail>> {
    return this.http.patch<ApiResponse<ApiTicketDetail>>(
      `${this.apiUrl}/${ticketId}/status`,
      payload
    );
  }

  deleteTicket(ticketId: string): Observable<ApiResponse<{ id: string; deleted: boolean }>> {
    return this.http.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `${this.apiUrl}/${ticketId}`
    );
  }

  addComment(
    ticketId: string,
    payload: { autorId: string; contenido: string }
  ): Observable<ApiResponse<ApiTicketComment | null>> {
    return this.http.post<ApiResponse<ApiTicketComment | null>>(
      `${this.apiUrl}/${ticketId}/comments`,
      payload
    );
  }

  listStatuses(): Observable<ApiResponse<ApiTicketStatus[]>> {
    return this.http.get<ApiResponse<ApiTicketStatus[]>>(`${this.apiUrl}/catalogs/statuses`);
  }

  listPriorities(): Observable<ApiResponse<ApiTicketPriority[]>> {
    return this.http.get<ApiResponse<ApiTicketPriority[]>>(`${this.apiUrl}/catalogs/priorities`);
  }

  getStats(
    params: Omit<ListTicketsParams, 'page' | 'limit' | 'sortBy' | 'sortDir'>
  ): Observable<ApiResponse<TicketStatsResponse>> {
    return this.http.get<ApiResponse<TicketStatsResponse>>(`${this.apiUrl}/stats`, {
      params: Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
      ),
    });
  }
}
