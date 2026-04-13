import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import type { ChartData, ChartOptions } from 'chart.js';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';

import { AuthService } from '../../services/auth.service';
import { BrowserStorageService } from '../../services/browser-storage.service';
import { PermissionService } from '../../services/permission.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { GroupApiService, ApiGroupSummary } from '../../services/group-api.service';
import { UserApiService } from '../../services/user-api.service';
import {
  ApiTicketListItem,
  TicketApiService,
  TicketStatsResponse,
} from '../../services/ticket-api.service';

interface TicketResumen {
  id: string;
  titulo: string;
  estado: string;
  prioridad: string;
  asignado: string;
  fecha: string;
}

interface GrupoActual {
  id: string;
  nombre: string;
  descripcion: string;
  integrantes: number;
}

type FiltroRapido = 'todos' | 'mis' | 'sinAsignar' | 'alta';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    ChartModule,
    HasPermissionDirective,
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit {
  user = 'usuario';
  currentUserId = '';

  grupos: GrupoActual[] = [];
  selectedGroupId = '';
  grupoActual: GrupoActual = this.emptyGroup();
  ticketStats: TicketStatsResponse = this.emptyStats();
  globalTicketStats: TicketStatsResponse = this.emptyStats();
  ticketsRecientes: TicketResumen[] = [];
  ticketsFiltrados: TicketResumen[] = [];
  filtroActivo: FiltroRapido = 'todos';
  statusChartData: ChartData<'doughnut'> = this.emptyDoughnutChartData();
  priorityChartData: ChartData<'bar'> = this.emptyBarChartData();
  groupChartData: ChartData<'bar'> = this.emptyBarChartData();
  doughnutChartOptions = this.buildDoughnutOptions();
  barChartOptions = this.buildBarOptions();

  loadingGroups = false;
  loadingDashboard = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private storage: BrowserStorageService,
    public permissionService: PermissionService,
    private groupApiService: GroupApiService,
    private userApiService: UserApiService,
    private ticketApiService: TicketApiService
  ) {}

  ngOnInit(): void {
    const currentUser = this.permissionService.getUser();

    if (currentUser) {
      this.user = currentUser.email;
      this.currentUserId = currentUser.id || '';
    }

    if (this.currentUserId) {
      this.loadGroups();
      return;
    }

    this.userApiService.getMe().subscribe({
      next: (response) => {
        this.currentUserId = response.data.id;
        this.loadGroups();
      },
      error: () => {
        this.loadGroups();
      },
    });
  }

  emptyGroup(): GrupoActual {
    return {
      id: '',
      nombre: 'Sin grupo activo',
      descripcion: 'Selecciona un grupo para cargar el contexto de tickets.',
      integrantes: 0,
    };
  }

  emptyStats(): TicketStatsResponse {
    return {
      summary: {
        total: 0,
      },
      byStatus: [],
      byPriority: [],
      byGroup: [],
      byAssigned: [],
    };
  }

  emptyDoughnutChartData(): ChartData<'doughnut'> {
    return {
      labels: [],
      datasets: [],
    };
  }

  emptyBarChartData(): ChartData<'bar'> {
    return {
      labels: [],
      datasets: [],
    };
  }

  get resumen() {
    return {
      total: this.ticketStats.summary.total,
      pendientes: this.getStatusCount('Pendiente'),
      progreso: this.getStatusCount('En progreso'),
      revision: this.getStatusCount('Revision'),
      hechos: this.getStatusCount('Realizado'),
      alta: this.getPriorityCount('Alta') + this.getPriorityCount('Urgente'),
    };
  }

  onGroupChange(groupId: string): void {
    this.selectedGroupId = groupId;
    this.setCurrentGroup(groupId);
    this.loadDashboardContext(groupId);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  aplicarFiltro(tipo: FiltroRapido): void {
    this.filtroActivo = tipo;

    switch (tipo) {
      case 'mis':
        this.ticketsFiltrados = this.ticketsRecientes.filter(
          ticket => ticket.asignado.toLowerCase() === this.user.toLowerCase()
        );
        break;

      case 'sinAsignar':
        this.ticketsFiltrados = this.ticketsRecientes.filter(
          ticket => !ticket.asignado || ticket.asignado === 'Sin asignar'
        );
        break;

      case 'alta':
        this.ticketsFiltrados = this.ticketsRecientes.filter(
          ticket => ticket.prioridad === 'Alta' || ticket.prioridad === 'Urgente'
        );
        break;

      case 'todos':
      default:
        this.ticketsFiltrados = [...this.ticketsRecientes];
        break;
    }
  }

  goToTickets(): void {
    this.router.navigate(['/group']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
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
    estado: string
  ): 'danger' | 'warn' | 'info' | 'success' | 'contrast' | 'secondary' {
    switch (this.normalizeStatusForApi(estado)) {
      case 'Pendiente':
        return 'warn';
      case 'En progreso':
        return 'info';
      case 'Revision':
        return 'secondary';
      case 'Realizado':
        return 'success';
      default:
        return 'contrast';
    }
  }

  getPrioridadSeverity(
    prioridad: string
  ): 'danger' | 'warn' | 'success' {
    switch (prioridad) {
      case 'Urgente':
      case 'Alta':
        return 'danger';
      case 'Media':
        return 'warn';
      case 'Baja':
      default:
        return 'success';
    }
  }

  private loadGroups(): void {
    this.loadingGroups = true;

    this.groupApiService.listGroups({
      memberUserId: this.currentUserId || undefined,
    }).subscribe({
      next: (response) => {
        this.grupos = response.data.map(group => this.mapApiGroup(group));

        const savedGroup = this.getSavedGroup();
        const nextGroupId =
          savedGroup?.id && this.grupos.some(group => group.id === savedGroup.id)
            ? savedGroup.id
            : this.grupos[0]?.id || '';

        if (nextGroupId) {
          this.selectedGroupId = nextGroupId;
          this.setCurrentGroup(nextGroupId);
          this.loadDashboardContext(nextGroupId);
        } else {
          this.grupoActual = this.emptyGroup();
          this.ticketStats = this.emptyStats();
          this.globalTicketStats = this.emptyStats();
          this.ticketsRecientes = [];
          this.ticketsFiltrados = [];
          this.statusChartData = this.emptyDoughnutChartData();
          this.priorityChartData = this.emptyBarChartData();
          this.groupChartData = this.emptyBarChartData();
        }
      },
      error: () => {
        this.loadingGroups = false;
      },
      complete: () => {
        this.loadingGroups = false;
      }
    });
  }

  private loadDashboardContext(groupId: string): void {
    if (!groupId) return;

    this.loadingDashboard = true;

    this.ticketApiService.getStats({ groupId }).subscribe({
      next: (response) => {
        this.ticketStats = response.data;
        this.statusChartData = this.buildStatusChartData(response.data);
        this.priorityChartData = this.buildPriorityChartData(response.data);
      },
      complete: () => {
        this.loadingDashboard = false;
      },
    });

    this.ticketApiService.getStats({}).subscribe({
      next: (response) => {
        this.globalTicketStats = response.data;
        this.groupChartData = this.buildGroupChartData(response.data);
      },
    });

    this.ticketApiService.listTickets({
      groupId,
      page: 1,
      limit: 8,
      sortBy: 'fecha',
      sortDir: 'desc',
    }).subscribe({
      next: (response) => {
        this.ticketsRecientes = response.data.items.map(ticket => this.mapApiTicket(ticket));
        this.aplicarFiltro(this.filtroActivo);
      },
      error: () => {
        this.ticketsRecientes = [];
        this.ticketsFiltrados = [];
      }
    });
  }

  private setCurrentGroup(groupId: string): void {
    const found = this.grupos.find(group => group.id === groupId) || this.emptyGroup();
    this.grupoActual = found;
    this.storage.setItem('currentGroup', JSON.stringify(found));
    this.permissionService.refreshPermissionsForGroup(groupId);
  }

  private getSavedGroup(): GrupoActual | null {
    const savedGroup = this.storage.getItem('currentGroup');
    if (!savedGroup) return null;

    try {
      return JSON.parse(savedGroup) as GrupoActual;
    } catch {
      return null;
    }
  }

  private mapApiGroup(group: ApiGroupSummary): GrupoActual {
    return {
      id: group.id,
      nombre: group.nombre,
      descripcion: group.descripcion || 'Grupo sin descripción registrada.',
      integrantes: Number(group.membersCount || 0),
    };
  }

  private mapApiTicket(ticket: ApiTicketListItem): TicketResumen {
    return {
      id: ticket.id,
      titulo: ticket.titulo,
      estado: this.getDisplayStatusName(ticket.statusName),
      prioridad: ticket.priorityName,
      asignado: ticket.assignedEmail || ticket.assignedFullName || ticket.assignedUsername || 'Sin asignar',
      fecha: this.formatDate(ticket.createdAt),
    };
  }

  private getStatusCount(statusName: string): number {
    return this.ticketStats.byStatus
      .filter(status => this.normalizeStatusForApi(status.nombre) === statusName)
      .reduce((total, status) => total + status.total, 0);
  }

  private getPriorityCount(priorityName: string): number {
    return this.ticketStats.byPriority
      .filter(priority => priority.nombre === priorityName)
      .reduce((total, priority) => total + priority.total, 0);
  }

  private normalizeStatusForApi(statusName: string): string {
    const map: Record<string, string> = {
      Revisión: 'Revision',
      Finalizado: 'Realizado',
      Hecho: 'Realizado',
    };

    return map[statusName] || statusName;
  }

  private getDisplayStatusName(status: string): string {
    if (status === 'Revision') return 'Revisión';
    if (status === 'Realizado') return 'Finalizado';
    return status;
  }

  private formatDate(value: string | null): string {
    if (!value) return 'Sin fecha';

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toLocaleDateString('es-MX');
  }

  private buildStatusChartData(stats: TicketStatsResponse): ChartData<'doughnut'> {
    return {
      labels: stats.byStatus.map(status => this.getDisplayStatusName(status.nombre)),
      datasets: [
        {
          data: stats.byStatus.map(status => status.total),
          backgroundColor: stats.byStatus.map(status => status.color || '#64748b'),
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    };
  }

  private buildPriorityChartData(stats: TicketStatsResponse): ChartData<'bar'> {
    const colorByPriority: Record<string, string> = {
      Baja: '#10b981',
      Media: '#f59e0b',
      Alta: '#ef4444',
      Urgente: '#7f1d1d',
    };

    return {
      labels: stats.byPriority.map(priority => priority.nombre),
      datasets: [
        {
          label: 'Tickets',
          data: stats.byPriority.map(priority => priority.total),
          backgroundColor: stats.byPriority.map(
            priority => colorByPriority[priority.nombre] || '#64748b'
          ),
          borderRadius: 14,
        },
      ],
    };
  }

  private buildGroupChartData(stats: TicketStatsResponse): ChartData<'bar'> {
    return {
      labels: stats.byGroup.map(group => group.nombre),
      datasets: [
        {
          label: 'Tickets por grupo',
          data: stats.byGroup.map(group => group.total),
          backgroundColor: '#2563eb',
          borderRadius: 14,
        },
      ],
    };
  }

  private buildDoughnutOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#0f172a',
            usePointStyle: true,
            padding: 18,
          },
        },
      },
    };
  }

  private buildBarOptions(): ChartOptions<'bar'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#475569',
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#475569',
            precision: 0,
          },
          grid: {
            color: '#e2e8f0',
          },
        },
      },
    };
  }
}
