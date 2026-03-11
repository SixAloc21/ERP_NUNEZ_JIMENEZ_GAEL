import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

interface UserItem {
  id: number;
  usuario: string;
  email: string;
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
  rol: string;
}

interface AssignedTicket {
  id: number;
  titulo: string;
  estado: 'Pendiente' | 'En progreso' | 'Revisión' | 'Finalizado';
  prioridad: 'Alta' | 'Media' | 'Baja';
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
    InputTextModule
  ],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  currentUser: UserItem = this.emptyUser();
  profileDialogVisible = false;
  currentEditUser: UserItem = this.emptyUser();

  assignedTickets: AssignedTicket[] = [
    {
      id: 1,
      titulo: 'Sidebar dinámico',
      estado: 'En progreso',
      prioridad: 'Media',
      fechaLimite: '2026-03-11'
    },
    {
      id: 2,
      titulo: 'Validación de permisos',
      estado: 'Pendiente',
      prioridad: 'Alta',
      fechaLimite: '2026-03-12'
    },
    {
      id: 3,
      titulo: 'Mejorar dashboard',
      estado: 'Finalizado',
      prioridad: 'Baja',
      fechaLimite: '2026-03-09'
    }
  ];

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const loggedUser = localStorage.getItem('loggedUser') || 'Gael';

      this.currentUser = {
        id: 1,
        usuario: loggedUser,
        email: `${loggedUser.toLowerCase()}@email.com`,
        nombreCompleto: 'Gael Martínez López',
        direccion: 'Av. Siempre Viva 742',
        telefono: '4421234567',
        fechaNacimiento: '2003-05-18',
        rol: 'Administrador'
      };
    }
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
      rol: ''
    };
  }

  openEditProfile(): void {
    this.currentEditUser = { ...this.currentUser };
    this.profileDialogVisible = true;
  }

  saveProfile(): void {
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

    this.currentUser = { ...this.currentEditUser };

    if (typeof window !== 'undefined') {
      localStorage.setItem('loggedUser', this.currentUser.usuario);
    }

    this.profileDialogVisible = false;
  }

  get abiertos(): number {
    return this.assignedTickets.filter(
      t => t.estado === 'Pendiente' || t.estado === 'Revisión'
    ).length;
  }

  get enProgreso(): number {
    return this.assignedTickets.filter(t => t.estado === 'En progreso').length;
  }

  get hechos(): number {
    return this.assignedTickets.filter(t => t.estado === 'Finalizado').length;
  }

  getPrioridadClass(prioridad: AssignedTicket['prioridad']): string {
    switch (prioridad) {
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

  getEstadoClass(estado: AssignedTicket['estado']): string {
    switch (estado) {
      case 'Pendiente':
        return 'status-pending';
      case 'En progreso':
        return 'status-progress';
      case 'Revisión':
        return 'status-review';
      case 'Finalizado':
        return 'status-done';
      default:
        return '';
    }
  }
}