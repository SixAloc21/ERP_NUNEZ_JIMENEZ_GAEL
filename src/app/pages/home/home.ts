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

interface GrupoActual {
  nombre: string;
  descripcion: string;
  modelo: string;
}

type FiltroRapido = 'todos' | 'mis' | 'sinAsignar' | 'alta';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TagModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  user = 'usuario';

  grupoActual: GrupoActual = {
    nombre: 'Equipo Dev',
    descripcion: 'Espacio de trabajo para gestión de tickets y seguimiento del proyecto.',
    modelo: 'GPT-4o mini'
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

  ticketsFiltrados: TicketResumen[] = [];
  filtroActivo: FiltroRapido = 'todos';

  constructor(
    private router: Router,
    private authService: AuthService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('loggedUser');
      if (savedUser) {
        this.user = savedUser;
      }

      const savedGroup = localStorage.getItem('currentGroup');
      if (savedGroup) {
        const grupo = JSON.parse(savedGroup);
        this.grupoActual = {
          nombre: grupo.nombre || 'Equipo Dev',
          descripcion: grupo.descripcion || 'Espacio de trabajo activo.',
          modelo: grupo.modelo || 'GPT-4o mini'
        };
      }
    }

    this.ticketsFiltrados = [...this.ticketsRecientes];
  }

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('loggedUser');
      localStorage.removeItem('currentGroup');
    }
    this.router.navigate(['/auth/login']);
  }

  aplicarFiltro(tipo: FiltroRapido): void {
    this.filtroActivo = tipo;

    switch (tipo) {
      case 'mis':
        this.ticketsFiltrados = this.ticketsRecientes.filter(
          ticket => ticket.asignado?.toLowerCase() === this.user.toLowerCase()
        );
        break;

      case 'sinAsignar':
        this.ticketsFiltrados = this.ticketsRecientes.filter(
          ticket => !ticket.asignado || ticket.asignado.trim() === ''
        );
        break;

      case 'alta':
        this.ticketsFiltrados = this.ticketsRecientes.filter(
          ticket => ticket.prioridad === 'Alta'
        );
        break;

      case 'todos':
      default:
        this.ticketsFiltrados = [...this.ticketsRecientes];
        break;
    }
  }

  getTextoFiltroActivo(): string {
    switch (this.filtroActivo) {
      case 'mis':
        return 'Mis tickets';
      case 'sinAsignar':
        return 'Tickets sin asignar';
      case 'alta':
        return 'Tickets con prioridad alta';
      default:
        return 'Todos';
    }
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