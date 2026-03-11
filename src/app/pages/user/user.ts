import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { AuthService } from '../../services/auth.service';

interface UserItem {
  id: number;
  usuario: string;
  email: string;
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  rol: string;
  permisos: string[];
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
    InputTextModule
  ],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent {
  users: UserItem[] = [
    {
      id: 1,
      usuario: 'Gael',
      email: 'gael@email.com',
      nombreCompleto: 'Gael Martínez López',
      direccion: 'Av. Siempre Viva 742',
      telefono: '4421234567',
      fechaNacimiento: '2003-05-18',
      rol: 'SuperAdmin',
      permisos: [
        'ver_usuarios',
        'crear_usuarios',
        'editar_usuarios',
        'eliminar_usuarios',
        'gestionar_permisos'
      ]
    },
    {
      id: 2,
      usuario: 'Ana',
      email: 'ana@email.com',
      nombreCompleto: 'Ana Torres García',
      direccion: 'Calle Luna 15',
      telefono: '4424567890',
      fechaNacimiento: '2002-11-10',
      rol: 'Frontend Dev',
      permisos: ['ver_usuarios', 'editar_usuarios']
    },
    {
      id: 3,
      usuario: 'Luis',
      email: 'luis@email.com',
      nombreCompleto: 'Luis Pérez Sánchez',
      direccion: 'Col. Centro 120',
      telefono: '4429876543',
      fechaNacimiento: '2001-08-25',
      rol: 'UI Designer',
      permisos: ['ver_usuarios']
    }
  ];

  availablePermissions: string[] = [
    'ver_usuarios',
    'crear_usuarios',
    'editar_usuarios',
    'eliminar_usuarios',
    'gestionar_permisos'
  ];

  loggedUser = '';

  userDialogVisible = false;
  permissionsDialogVisible = false;

  currentEditUser: UserItem = this.emptyUser();
  currentPermissionUser: UserItem = this.emptyUser();

  private userIdCounter = 4;

  constructor(public auth: AuthService) {
    this.loggedUser = localStorage.getItem('loggedUser') || '';
    this.auth.loggedUser = this.loggedUser;
    this.auth.setUsers(this.users);
  }

  emptyUser(): UserItem {
    return {
      id: 0,
      usuario: '',
      email: '',
      nombreCompleto: '',
      direccion: '',
      telefono: '',
      fechaNacimiento: '',
      rol: '',
      permisos: []
    };
  }

  get currentLoggedUser(): UserItem | undefined {
    return this.users.find(u => u.usuario === this.loggedUser);
  }

  get isSuperAdmin(): boolean {
    return this.currentLoggedUser?.rol === 'SuperAdmin';
  }

  refreshAuthUsers(): void {
    this.auth.setUsers(this.users);
  }

  openNewUser(): void {
    if (!this.auth.hasPermission('crear_usuarios')) return;

    this.currentEditUser = this.emptyUser();
    this.userDialogVisible = true;
  }

  editUser(user: UserItem): void {
    if (!this.auth.hasPermission('editar_usuarios')) return;

    this.currentEditUser = {
      ...user,
      permisos: [...user.permisos]
    };
    this.userDialogVisible = true;
  }

  saveUser(): void {
    if (
      !this.currentEditUser.usuario.trim() ||
      !this.currentEditUser.email.trim() ||
      !this.currentEditUser.nombreCompleto.trim() ||
      !this.currentEditUser.direccion.trim() ||
      !this.currentEditUser.telefono.trim() ||
      !this.currentEditUser.fechaNacimiento.trim() ||
      !this.currentEditUser.rol.trim()
    ) {
      return;
    }

    if (this.currentEditUser.id === 0) {
      this.currentEditUser.id = this.userIdCounter++;

      if (!this.currentEditUser.permisos.length) {
        this.currentEditUser.permisos = ['ver_usuarios'];
      }

      this.users.push({
        ...this.currentEditUser,
        permisos: [...this.currentEditUser.permisos]
      });
    } else {
      const index = this.users.findIndex(u => u.id === this.currentEditUser.id);

      if (index !== -1) {
        this.users[index] = {
          ...this.currentEditUser,
          permisos: [...this.currentEditUser.permisos]
        };
      }
    }

    this.refreshAuthUsers();
    this.userDialogVisible = false;
  }

  deleteUser(user: UserItem): void {
    if (!this.auth.hasPermission('eliminar_usuarios')) return;
    if (user.usuario === this.loggedUser) return;

    this.users = this.users.filter(u => u.id !== user.id);
    this.refreshAuthUsers();
  }

  openPermissions(user: UserItem): void {
    if (!this.auth.hasPermission('gestionar_permisos')) return;

    this.currentPermissionUser = {
      ...user,
      permisos: [...user.permisos]
    };
    this.permissionsDialogVisible = true;
  }

  hasPermission(permission: string): boolean {
    return this.currentPermissionUser.permisos.includes(permission);
  }

  togglePermission(permission: string): void {
    const exists = this.currentPermissionUser.permisos.includes(permission);

    if (exists) {
      this.currentPermissionUser.permisos =
        this.currentPermissionUser.permisos.filter(p => p !== permission);
    } else {
      this.currentPermissionUser.permisos.push(permission);
    }
  }

  savePermissions(): void {
    const index = this.users.findIndex(u => u.id === this.currentPermissionUser.id);

    if (index !== -1) {
      this.users[index] = {
        ...this.currentPermissionUser,
        permisos: [...this.currentPermissionUser.permisos]
      };
    }

    this.refreshAuthUsers();
    this.permissionsDialogVisible = false;
  }

  getPermissionLabel(permission: string): string {
    const labels: Record<string, string> = {
      ver_usuarios: 'Ver usuarios',
      crear_usuarios: 'Crear usuarios',
      editar_usuarios: 'Editar usuarios',
      eliminar_usuarios: 'Eliminar usuarios',
      gestionar_permisos: 'Gestionar permisos'
    };

    return labels[permission] || permission;
  }

  getPermissionIcon(permission: string): string {
    const icons: Record<string, string> = {
      ver_usuarios: 'pi pi-eye',
      crear_usuarios: 'pi pi-plus-circle',
      editar_usuarios: 'pi pi-pencil',
      eliminar_usuarios: 'pi pi-trash',
      gestionar_permisos: 'pi pi-key'
    };

    return icons[permission] || 'pi pi-shield';
  }
}