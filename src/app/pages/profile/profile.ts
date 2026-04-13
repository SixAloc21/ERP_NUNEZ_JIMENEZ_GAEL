import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { BrowserStorageService } from '../../services/browser-storage.service';
import { LoggedUser, PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { ApiUser, UserApiService } from '../../services/user-api.service';
import { TicketApiService } from '../../services/ticket-api.service';

interface UserItem {
  id: string;
  usuario: string;
  email: string;
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  rol: string;
  permisos: string[];
}

interface AssignedTicket {
  id: string;
  titulo: string;
  estado: string;
  prioridad: string;
  fechaLimite: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    HasPermissionDirective
  ],
  providers: [MessageService],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  currentUser: UserItem = this.emptyUser();
  profileDialogVisible = false;
  currentEditUser: UserItem = this.emptyUser();
  loggedUserData: LoggedUser | null = null;
  assignedTickets: AssignedTicket[] = [];

  loadingProfile = false;
  loadingTickets = false;
  savingProfile = false;

  constructor(
    private userApiService: UserApiService,
    private ticketApiService: TicketApiService,
    private permissionService: PermissionService,
    private storage: BrowserStorageService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loggedUserData = this.permissionService.getUser();
    this.loadProfile();
  }

  emptyUser(): UserItem {
    return {
      id: '',
      usuario: '',
      email: '',
      nombreCompleto: '',
      direccion: '',
      telefono: '',
      fechaNacimiento: '',
      rol: '',
      permisos: [],
    };
  }

  openEditProfile(): void {
    this.currentEditUser = { ...this.currentUser };
    this.profileDialogVisible = true;
  }

  saveProfile(): void {
    if (this.savingProfile) return;

    if (
      !this.currentEditUser.usuario.trim() ||
      !this.currentEditUser.email.trim() ||
      !this.currentEditUser.nombreCompleto.trim()
    ) {
      this.showWarn('Completa usuario, correo y nombre completo');
      return;
    }

    this.savingProfile = true;

    this.userApiService
      .updateMe({
        username: this.currentEditUser.usuario.trim(),
        email: this.currentEditUser.email.trim().toLowerCase(),
        nombre_completo: this.currentEditUser.nombreCompleto.trim(),
        direccion: this.currentEditUser.direccion.trim(),
        telefono: this.currentEditUser.telefono.trim(),
        fecha_inicio: this.currentEditUser.fechaNacimiento || undefined,
      })
      .subscribe({
        next: (response) => {
          this.currentUser = this.mapApiUser(response.data);
          this.currentEditUser = { ...this.currentUser };
          this.profileDialogVisible = false;
          this.updateStoredSession(response.data);
          this.showSuccess('Perfil actualizado correctamente');
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo actualizar el perfil');
          this.savingProfile = false;
        },
        complete: () => {
          this.savingProfile = false;
        }
      });
  }

  get abiertos(): number {
    return this.assignedTickets.filter(
      ticket => ['Pendiente', 'Revision', 'Revisión'].includes(ticket.estado)
    ).length;
  }

  get enProgreso(): number {
    return this.assignedTickets.filter(ticket => ticket.estado === 'En progreso').length;
  }

  get hechos(): number {
    return this.assignedTickets.filter(ticket =>
      ['Finalizado', 'Realizado', 'Hecho'].includes(ticket.estado)
    ).length;
  }

  getPrioridadClass(prioridad: string): string {
    switch (prioridad) {
      case 'Urgente':
      case 'Alta':
        return 'priority-high';
      case 'Media':
        return 'priority-medium';
      case 'Baja':
        return 'priority-low';
      default:
        return '';
    }
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'En progreso':
        return 'status-progress';
      case 'Revision':
      case 'Revisión':
        return 'status-review';
      case 'Realizado':
      case 'Finalizado':
      case 'Hecho':
        return 'status-done';
      default:
        return '';
    }
  }

  private loadProfile(): void {
    this.loadingProfile = true;

    this.userApiService.getMe().subscribe({
      next: (response) => {
        this.currentUser = this.mapApiUser(response.data);
        this.currentEditUser = { ...this.currentUser };
        const canViewOwnTickets = this.permissionService
          .normalizePermissions(response.data.permisos || [])
          .some(permission =>
            ['tickets:view', 'tickets:manage', 'tickets:edit', 'tickets:comment', 'tickets:move']
              .includes(permission)
          );

        if (canViewOwnTickets) {
          this.loadAssignedTickets(response.data.id);
        } else {
          this.assignedTickets = [];
          this.loadingTickets = false;
        }
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo cargar el perfil');
        this.loadingProfile = false;
      },
      complete: () => {
        this.loadingProfile = false;
      }
    });
  }

  private loadAssignedTickets(userId: string): void {
    this.loadingTickets = true;

    this.ticketApiService.listTickets({
      assignedUserId: userId,
      page: 1,
      limit: 20,
      sortBy: 'fecha',
      sortDir: 'desc',
    }).subscribe({
      next: (response) => {
        this.assignedTickets = response.data.items.map(ticket => ({
          id: ticket.id,
          titulo: ticket.titulo,
          estado: this.getDisplayStatusName(ticket.statusName),
          prioridad: ticket.priorityName,
          fechaLimite: this.formatDate(ticket.fechaFinal),
        }));
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar los tickets asignados');
        this.loadingTickets = false;
      },
      complete: () => {
        this.loadingTickets = false;
      }
    });
  }

  private mapApiUser(user: ApiUser): UserItem {
    const permisos = this.permissionService.normalizePermissions(user.permisos || []);

    return {
      id: user.id,
      usuario: user.username,
      email: user.email,
      nombreCompleto: user.nombre_completo,
      direccion: user.direccion || '',
      telefono: user.telefono || '',
      fechaNacimiento: user.fecha_inicio || '',
      rol: this.getRoleFromPermissions(permisos),
      permisos,
    };
  }

  private getRoleFromPermissions(permissions: string[]): string {
    if (
      permissions.includes('user:manage') &&
      permissions.includes('group:manage') &&
      permissions.includes('tickets:manage')
    ) {
      return 'SuperAdmin';
    }

    if (
      permissions.includes('group:manage') &&
      permissions.includes('tickets:manage')
    ) {
      return 'Project Manager';
    }

    if (
      permissions.includes('tickets:edit') &&
      permissions.includes('tickets:move')
    ) {
      return 'Developer';
    }

    if (permissions.includes('tickets:comment')) {
      return 'Support';
    }

    return 'Usuario';
  }

  private updateStoredSession(user: ApiUser): void {
    const currentSession = this.permissionService.getUser();

    if (!currentSession) {
      return;
    }

    const updatedLoggedUser: LoggedUser = {
      ...currentSession,
      username: user.username,
      email: user.email,
      permissions: this.permissionService.normalizePermissions(user.permisos || []),
    };

    this.storage.setItem('loggedUser', JSON.stringify(updatedLoggedUser));
    this.loggedUserData = updatedLoggedUser;
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return 'Sin fecha límite';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString('es-MX');
  }

  private getDisplayStatusName(status: string): string {
    if (status === 'Revision') return 'Revisión';
    if (status === 'Realizado') return 'Finalizado';
    return status;
  }

  private handleHttpError(error: unknown, fallbackMessage: string): void {
    const detail =
      (error as { error?: { data?: { error?: string; message?: string } } })?.error?.data
        ?.error ||
      (error as { error?: { data?: { message?: string } } })?.error?.data?.message ||
      fallbackMessage;

    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail,
    });
  }

  private showSuccess(detail: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Correcto',
      detail,
    });
  }

  private showWarn(detail: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Atención',
      detail,
    });
  }
}
