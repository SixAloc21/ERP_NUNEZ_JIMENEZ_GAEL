import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

interface TicketResumen {
  titulo: string;
  estado: 'Pendiente' | 'En progreso' | 'Revisión' | 'Hecho' | 'Bloqueado';
  prioridad: 'Alta' | 'Media' | 'Baja';
  asignado: string;
  fecha: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  user = localStorage.getItem('loggedUser') || 'usuario';

  grupoActual = {
    nombre: 'Equipo Dev',
    descripcion: 'Espacio de trabajo para gestión de tickets y seguimiento del proyecto.',
  };

  resumen = {
    total: 12,
    pendientes: 4,
    progreso: 3,
    revision: 2,
    hechos: 2,
    bloqueados: 1
  };

  ticketsRecientes: TicketResumen[] = [
    {
      titulo: 'Error en login',
      estado: 'Pendiente',
      prioridad: 'Alta',
      asignado: 'Gael',
      fecha: '09/03/2026'
    },
    {
      titulo: 'Ajustar sidebar',
      estado: 'En progreso',
      prioridad: 'Media',
      asignado: 'Gael',
      fecha: '08/03/2026'
    },
    {
      titulo: 'Vista de usuarios',
      estado: 'Revisión',
      prioridad: 'Alta',
      asignado: 'Ana',
      fecha: '08/03/2026'
    },
    {
      titulo: 'Mejorar dashboard',
      estado: 'Hecho',
      prioridad: 'Baja',
      asignado: 'Luis',
      fecha: '07/03/2026'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.authService.loginMock();
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedUser');
    this.router.navigate(['/auth/login']);
  }

  goToGroups(): void {
    this.router.navigate(['/group']);
  }

  goToUsers(): void {
    this.router.navigate(['/user']);
  }

  getEstadoSeverity(
    estado: TicketResumen['estado']
  ): 'danger' | 'warn' | 'info' | 'success' | 'contrast' | 'secondary' {
    switch (estado) {
      case 'Pendiente':
        return 'warn';
      case 'En progreso':
        return 'info';
      case 'Revisión':
        return 'secondary';
      case 'Hecho':
        return 'success';
      case 'Bloqueado':
        return 'danger';
      default:
        return 'contrast';
    }
  }

  getPrioridadSeverity(
    prioridad: TicketResumen['prioridad']
  ): 'danger' | 'warn' | 'success' {
    switch (prioridad) {
      case 'Alta':
        return 'danger';
      case 'Media':
        return 'warn';
      case 'Baja':
        return 'success';
      default:
        return 'success';
    }
  }
}