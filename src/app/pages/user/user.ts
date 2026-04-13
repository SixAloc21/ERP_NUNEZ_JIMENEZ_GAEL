import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  PermissionService,
  AppPermission,
  LoggedUser
} from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import {
  UserApiService,
  ApiUser,
  ApiPermissionItem,
  SaveUserPayload,
} from '../../services/user-api.service';

interface UserItem {
  id: string;
  usuario: string;
  email: string;
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  rol: string;
  permisos: AppPermission[];
  password: string;
  activo: boolean;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    PasswordModule,
    ToastModule,
    HasPermissionDirective
  ],
  providers: [MessageService],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent implements OnInit {
  users: UserItem[] = [];

  availablePermissions: AppPermission[] = [];

  loggedUser = '';

  userDialogVisible = false;
  permissionsDialogVisible = false;
  loadingUsers = false;
  savingUser = false;
  savingPermissions = false;
  deletingUserId: string | null = null;

  currentEditUser: UserItem = this.emptyUser();
  currentPermissionUser: UserItem = this.emptyUser();

  constructor(
    public permissionService: PermissionService,
    private userApiService: UserApiService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const currentUser: LoggedUser | null = this.permissionService.getUser();

    if (currentUser) {
      this.loggedUser = currentUser.username;
    }

    this.loadUsers();
    this.loadPermissions();
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
      password: '',
      activo: true
    };
  }

  get currentLoggedUser(): UserItem | undefined {
    return this.users.find(u => u.usuario === this.loggedUser);
  }

  get isSuperAdmin(): boolean {
    return this.currentLoggedUser?.rol === 'SuperAdmin';
  }

  openNewUser(): void {
    if (!this.permissionService.hasPermission('user:add')) return;

    this.currentEditUser = this.emptyUser();
    this.userDialogVisible = true;
  }

  editUser(user: UserItem): void {
    if (!this.permissionService.hasPermission('user:edit')) return;

    this.currentEditUser = {
      ...user,
      permisos: [...user.permisos]
    };
    this.userDialogVisible = true;
  }

  saveUser(): void {
    if (this.savingUser) return;
    const isNewUser = !this.currentEditUser.id;

    if (
      !this.currentEditUser.usuario.trim() ||
      !this.currentEditUser.email.trim() ||
      !this.currentEditUser.nombreCompleto.trim()
    ) {
      this.showWarn('Completa los campos obligatorios del usuario');
      return;
    }

    if (isNewUser && !this.currentEditUser.password.trim()) {
      this.showWarn('La contraseña es obligatoria al crear un usuario');
      return;
    }

    if (isNewUser && !this.permissionService.hasPermission('user:add')) return;
    if (!isNewUser && !this.permissionService.hasPermission('user:edit')) return;

    this.savingUser = true;

    const payload = this.buildSavePayload(this.currentEditUser);

    if (isNewUser) {
      this.userApiService.createUser(payload).subscribe({
        next: () => {
          this.showSuccess('Usuario creado correctamente');
          this.userDialogVisible = false;
          this.currentEditUser = this.emptyUser();
          this.loadUsers();
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo crear el usuario');
          this.savingUser = false;
        },
        complete: () => {
          this.savingUser = false;
        }
      });
    } else {
      this.userApiService.updateUser(this.currentEditUser.id, payload).subscribe({
        next: () => {
          this.showSuccess('Usuario actualizado correctamente');
          this.userDialogVisible = false;
          this.currentEditUser = this.emptyUser();
          this.loadUsers();
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo actualizar el usuario');
          this.savingUser = false;
        },
        complete: () => {
          this.savingUser = false;
        }
      });
    }
  }

  deleteUser(user: UserItem): void {
    if (!this.permissionService.hasPermission('user:delete')) return;
    if (user.usuario === this.loggedUser) return;

    this.deletingUserId = user.id;

    this.userApiService.deleteUser(user.id).subscribe({
      next: () => {
        this.showSuccess('Usuario eliminado correctamente');
        this.loadUsers();
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo eliminar el usuario');
        this.deletingUserId = null;
      },
      complete: () => {
        this.deletingUserId = null;
      }
    });
  }

  openPermissions(user: UserItem): void {
    if (!this.permissionService.hasPermission('user:edit')) return;

    this.currentPermissionUser = {
      ...user,
      permisos: [...user.permisos]
    };
    this.permissionsDialogVisible = true;
  }

  hasPermission(permission: AppPermission): boolean {
    return this.currentPermissionUser.permisos.includes(permission);
  }

  togglePermission(permission: AppPermission): void {
    if (!this.permissionService.hasPermission('user:edit')) return;

    if (this.hasPermission(permission)) {
      this.currentPermissionUser.permisos =
        this.currentPermissionUser.permisos.filter(p => p !== permission);
    } else {
      this.currentPermissionUser.permisos.push(permission);
    }
  }

  savePermissions(): void {
    if (this.savingPermissions) return;
    if (!this.permissionService.hasPermission('user:edit')) return;

    this.savingPermissions = true;

    this.userApiService
      .updateGlobalPermissions(
        this.currentPermissionUser.id,
        this.currentPermissionUser.permisos
      )
      .subscribe({
        next: () => {
          this.showSuccess('Permisos actualizados correctamente');
          this.permissionsDialogVisible = false;
          this.currentPermissionUser = this.emptyUser();
          this.loadUsers();
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudieron actualizar los permisos');
          this.savingPermissions = false;
        },
        complete: () => {
          this.savingPermissions = false;
        }
      });
  }

  private loadUsers(): void {
    this.loadingUsers = true;

    this.userApiService.listUsers().subscribe({
      next: (response) => {
        this.users = response.data.map(user => this.mapApiUser(user));
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar los usuarios');
        this.loadingUsers = false;
      },
      complete: () => {
        this.loadingUsers = false;
      }
    });
  }

  private loadPermissions(): void {
    this.userApiService.listGlobalPermissions().subscribe({
      next: (response) => {
        this.availablePermissions = response.data.map(
          (permission: ApiPermissionItem) =>
            this.permissionService.normalizePermissionName(permission.nombre) as AppPermission
        );
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo cargar el catálogo de permisos');
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
      password: '',
      activo: user.activo,
    };
  }

  private buildSavePayload(user: UserItem): SaveUserPayload {
    const payload: SaveUserPayload = {
      nombre_completo: user.nombreCompleto.trim(),
      username: user.usuario.trim(),
      email: user.email.trim().toLowerCase(),
    };

    if (user.direccion.trim()) {
      payload.direccion = user.direccion.trim();
    }

    if (user.telefono.trim()) {
      payload.telefono = user.telefono.trim();
    }

    if (user.fechaNacimiento.trim()) {
      payload.fecha_inicio = user.fechaNacimiento.trim();
    }

    if (user.password.trim()) {
      payload.password = user.password.trim();
    }

    return payload;
  }

  private getRoleFromPermissions(permissions: AppPermission[]): string {
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

  getPermissionLabel(permission: AppPermission): string {
    const labels: Partial<Record<AppPermission, string>> = {
      'user:view': 'Ver usuarios',
      'user:add': 'Agregar usuarios',
      'user:edit': 'Editar usuarios',
      'user:edit:profile': 'Editar perfil',
      'user:delete': 'Eliminar usuarios',
      'user:manage': 'Gestionar usuarios',
      'group:view': 'Ver grupos',
      'group:add': 'Agregar grupos',
      'group:edit': 'Editar grupos',
      'group:delete': 'Eliminar grupos',
      'group:manage': 'Gestionar grupos',
      'ticket:view': 'Ver tickets',
      'ticket:add': 'Agregar tickets',
      'ticket:edit': 'Editar tickets',
      'ticket:delete': 'Eliminar tickets',
      'ticket:edit:state': 'Mover tickets',
      'ticket:edit:comment': 'Comentar tickets',
      'ticket:manage': 'Gestionar tickets',
      'tickets:view': 'Ver tickets',
      'tickets:add': 'Agregar tickets',
      'tickets:edit': 'Editar tickets',
      'tickets:delete': 'Eliminar tickets',
      'tickets:move': 'Mover tickets',
      'tickets:comment': 'Comentar tickets',
      'tickets:manage': 'Gestionar tickets'
    };

    return labels[permission] || permission;
  }

  getPermissionIcon(permission: AppPermission): string {
    const icons: Partial<Record<AppPermission, string>> = {
      'user:view': 'pi-eye',
      'user:add': 'pi-user-plus',
      'user:edit': 'pi-pencil',
      'user:edit:profile': 'pi-user-edit',
      'user:delete': 'pi-trash',
      'user:manage': 'pi-users',
      'group:view': 'pi-folder-open',
      'group:add': 'pi-plus-circle',
      'group:edit': 'pi-file-edit',
      'group:delete': 'pi-times-circle',
      'group:manage': 'pi-sitemap',
      'ticket:view': 'pi-ticket',
      'ticket:add': 'pi-plus',
      'ticket:edit': 'pi-pencil',
      'ticket:delete': 'pi-trash',
      'ticket:edit:state': 'pi-refresh',
      'ticket:edit:comment': 'pi-comments',
      'ticket:manage': 'pi-briefcase',
      'tickets:view': 'pi-ticket',
      'tickets:add': 'pi-plus',
      'tickets:edit': 'pi-pencil',
      'tickets:delete': 'pi-trash',
      'tickets:move': 'pi-refresh',
      'tickets:comment': 'pi-comments',
      'tickets:manage': 'pi-briefcase'
    };

    return icons[permission] || 'pi-shield';
  }
}
