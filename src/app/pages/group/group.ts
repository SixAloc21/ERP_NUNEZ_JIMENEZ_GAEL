import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { AppPermission, PermissionService } from '../../services/permission.service';
import {
  GroupApiService,
  ApiGroupSummary,
  ApiGroupMember,
} from '../../services/group-api.service';
import { UserApiService, ApiUser } from '../../services/user-api.service';
import {
  TicketApiService,
  ApiTicketComment,
  ApiTicketDetail,
  ApiTicketHistory,
  ApiTicketListItem,
  ApiTicketPriority,
  ApiTicketStatus,
  TicketStatsResponse,
} from '../../services/ticket-api.service';

interface Group {
  id: string;
  nivel: string;
  autor: string;
  nombre: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
  creadorId: string;
}

interface Member {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  permisos: AppPermission[];
}

interface TicketComment {
  id: string;
  autor: string;
  mensaje: string;
  fecha: string;
}

interface TicketHistory {
  id: string;
  accion: string;
  fecha: string;
}

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  estadoId: string;
  prioridad: string;
  prioridadId: string;
  asignadoA: string;
  asignadoId: string | null;
  fechaCreacion: string;
  fechaLimite: string;
  comentarios: TicketComment[];
  historial: TicketHistory[];
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    PaginatorModule,
    FormsModule,
    DragDropModule,
    TooltipModule,
    ToastModule,
    HasPermissionDirective
  ],
  providers: [MessageService],
  templateUrl: './group.html',
  styleUrls: ['./group.css']
})
export class GroupComponent implements OnInit {
  groups: Group[] = [];
  members: Member[] = [];
  availableUsers: ApiUser[] = [];
  availablePermissions: AppPermission[] = [];
  ticketStatuses: ApiTicketStatus[] = [];
  ticketPriorities: ApiTicketPriority[] = [];
  ticketsList: Ticket[] = [];
  ticketStats: TicketStatsResponse = this.emptyTicketStats();
  ticketPage = 1;
  ticketLimit = 10;
  ticketTotal = 0;
  ticketSearch = '';
  ticketEstadoNombre = '';
  ticketPrioridadNombre = '';
  ticketAssignedUserId = '';
  ticketSortBy: 'id' | 'titulo' | 'prioridad' | 'fecha' = 'fecha';
  ticketSortDir: 'asc' | 'desc' = 'desc';

  dialogVisible = false;
  memberDialogVisible = false;
  ticketDialogVisible = false;
  ticketDetailVisible = false;

  currentView: 'grupo' | 'tickets' = 'grupo';
  ticketView: 'lista' | 'kanban' = 'lista';

  currentGroup: Group = this.emptyGroup();
  currentMember: Member = this.emptyMember();
  currentTicket: Ticket = this.emptyTicket();
  selectedTicket: Ticket = this.emptyTicket();

  selectedGroupId: string | null = null;
  selectedMemberUserId = '';
  newComment = '';

  loadingGroups = false;
  loadingMembers = false;
  loadingTickets = false;
  loadingTicketDetail = false;
  savingGroup = false;
  savingMember = false;
  savingTicket = false;
  savingComment = false;
  deletingGroupId: string | null = null;
  deletingMemberId: string | null = null;
  deletingTicketId: string | null = null;

  private currentUserId = '';

  constructor(
    private groupApiService: GroupApiService,
    private userApiService: UserApiService,
    private ticketApiService: TicketApiService,
    private permissionService: PermissionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUserIdAndBootstrap();
  }

  emptyGroup(): Group {
    return {
      id: '',
      nivel: '',
      autor: '',
      nombre: '',
      integrantes: 0,
      tickets: 0,
      descripcion: '',
      creadorId: ''
    };
  }

  emptyMember(): Member {
    return {
      id: '',
      nombre: '',
      email: '',
      rol: '',
      permisos: []
    };
  }

  emptyTicket(): Ticket {
    return {
      id: '',
      titulo: '',
      descripcion: '',
      estado: this.ticketStatuses[0]?.nombre
        ? this.getDisplayStatusName(this.ticketStatuses[0].nombre)
        : 'Pendiente',
      estadoId: this.ticketStatuses[0]?.id || '',
      prioridad: this.ticketPriorities.find(priority => priority.nombre === 'Media')?.nombre
        || this.ticketPriorities[0]?.nombre
        || 'Media',
      prioridadId: this.ticketPriorities.find(priority => priority.nombre === 'Media')?.id
        || this.ticketPriorities[0]?.id
        || '',
      asignadoA: '',
      asignadoId: null,
      fechaCreacion: this.today(),
      fechaLimite: '',
      comentarios: [],
      historial: []
    };
  }

  emptyTicketStats(): TicketStatsResponse {
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

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  get selectedGroup(): Group | null {
    if (!this.groups.length) return null;

    const found = this.groups.find(g => g.id === this.selectedGroupId);
    return found ?? this.groups[0];
  }

  get selectableUsers(): ApiUser[] {
    if (this.selectedMemberUserId) {
      return this.availableUsers;
    }

    const existingIds = new Set(this.members.map(member => member.id));
    return this.availableUsers.filter(user => !existingIds.has(user.id));
  }

  get groupMemberOptions(): Array<{ id: string; label: string }> {
    return this.members.map(member => ({
      id: member.id,
      label: `${member.nombre} (${member.email})`,
    }));
  }

  get isEditingGroup(): boolean {
    return !!this.currentGroup.id;
  }

  get isEditingMember(): boolean {
    return this.members.some(member => member.id === this.selectedMemberUserId);
  }

  get isEditingTicket(): boolean {
    return !!this.currentTicket.id;
  }

  get pendientes(): number {
    return this.getStatusCount('Pendiente');
  }

  get enProgreso(): number {
    return this.getStatusCount('En progreso');
  }

  get revision(): number {
    return this.getStatusCount('Revision');
  }

  get finalizados(): number {
    return this.getStatusCount('Realizado');
  }

  get ticketsPendientes(): Ticket[] {
    return this.ticketsList.filter(t => this.normalizeStatusForApi(t.estado) === 'Pendiente');
  }

  get ticketsEnProgreso(): Ticket[] {
    return this.ticketsList.filter(t => this.normalizeStatusForApi(t.estado) === 'En progreso');
  }

  get ticketsRevision(): Ticket[] {
    return this.ticketsList.filter(t => this.normalizeStatusForApi(t.estado) === 'Revision');
  }

  get ticketsFinalizados(): Ticket[] {
    return this.ticketsList.filter(t => this.normalizeStatusForApi(t.estado) === 'Realizado');
  }

  get ticketFirstRow(): number {
    return (this.ticketPage - 1) * this.ticketLimit;
  }

  selectGroup(group: Group): void {
    this.selectedGroupId = group.id;
    this.ticketPage = 1;
    this.permissionService.refreshPermissionsForGroup(group.id);
    this.loadMembers(group.id);
    this.loadTickets(group.id);
    this.loadTicketStats(group.id);
  }

  isSelectedGroup(group: Group): boolean {
    return this.selectedGroup?.id === group.id;
  }

  openNew(): void {
    this.currentGroup = this.emptyGroup();
    this.dialogVisible = true;
  }

  editGroup(group: Group): void {
    this.currentGroup = { ...group };
    this.dialogVisible = true;
  }

  saveGroup(): void {
    if (this.savingGroup) return;

    if (!this.currentGroup.nombre.trim() || !this.currentGroup.descripcion.trim()) {
      this.showWarn('Completa el nombre y la descripción del grupo');
      return;
    }

    if (!this.currentGroup.id && !this.currentUserId) {
      this.showWarn('No se pudo resolver el usuario actual para crear el grupo');
      return;
    }

    this.savingGroup = true;

    if (!this.currentGroup.id) {
      this.groupApiService
        .createGroup({
          nombre: this.currentGroup.nombre.trim(),
          descripcion: this.currentGroup.descripcion.trim(),
          creadorId: this.currentUserId
        })
        .subscribe({
          next: () => {
            this.showSuccess('Grupo creado correctamente');
            this.dialogVisible = false;
            this.currentGroup = this.emptyGroup();
            this.loadGroups();
          },
          error: (error) => {
            this.handleHttpError(error, 'No se pudo crear el grupo');
            this.savingGroup = false;
          },
          complete: () => {
            this.savingGroup = false;
          }
        });
      return;
    }

    this.groupApiService
      .updateGroup(this.currentGroup.id, {
        nombre: this.currentGroup.nombre.trim(),
        descripcion: this.currentGroup.descripcion.trim()
      })
      .subscribe({
        next: () => {
          const updatedGroupId = this.currentGroup.id;
          this.showSuccess('Grupo actualizado correctamente');
          this.dialogVisible = false;
          this.currentGroup = this.emptyGroup();
          this.loadGroups(updatedGroupId);
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo actualizar el grupo');
          this.savingGroup = false;
        },
        complete: () => {
          this.savingGroup = false;
        }
      });
  }

  deleteGroup(group: Group): void {
    this.deletingGroupId = group.id;

    this.groupApiService.deleteGroup(group.id).subscribe({
      next: () => {
        this.showSuccess('Grupo eliminado correctamente');
        if (this.selectedGroupId === group.id) {
          this.selectedGroupId = null;
          this.members = [];
          this.ticketsList = [];
          this.ticketTotal = 0;
          this.ticketStats = this.emptyTicketStats();
        }
        this.loadGroups();
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo eliminar el grupo');
        this.deletingGroupId = null;
      },
      complete: () => {
        this.deletingGroupId = null;
      }
    });
  }

  openNewMember(): void {
    if (!this.selectedGroupId) {
      this.showWarn('Selecciona un grupo antes de agregar miembros');
      return;
    }

    this.currentMember = this.emptyMember();
    this.selectedMemberUserId = '';
    this.memberDialogVisible = true;
  }

  editMember(member: Member): void {
    this.currentMember = {
      ...member,
      permisos: [...member.permisos]
    };
    this.selectedMemberUserId = member.id;
    this.memberDialogVisible = true;
  }

  onSelectedMemberChange(userId: string): void {
    this.selectedMemberUserId = userId;
    const selectedUser = this.availableUsers.find(user => user.id === userId);

    if (!selectedUser) {
      this.currentMember.nombre = '';
      this.currentMember.email = '';
      return;
    }

    const currentPermissions =
      this.currentMember.id === selectedUser.id ? [...this.currentMember.permisos] : [];

    this.currentMember.id = selectedUser.id;
    this.currentMember.nombre = selectedUser.nombre_completo;
    this.currentMember.email = selectedUser.email;
    this.currentMember.permisos = currentPermissions;
    this.currentMember.rol = this.getRoleFromPermissions(currentPermissions);
  }

  toggleMemberPermission(permission: AppPermission): void {
    if (this.currentMember.permisos.includes(permission)) {
      this.currentMember.permisos = this.currentMember.permisos.filter(p => p !== permission);
    } else {
      this.currentMember.permisos = [...this.currentMember.permisos, permission];
    }

    this.currentMember.rol = this.getRoleFromPermissions(this.currentMember.permisos);
  }

  saveMember(): void {
    if (this.savingMember) return;

    const groupId = this.selectedGroupId;
    if (!groupId) {
      this.showWarn('Selecciona un grupo antes de gestionar miembros');
      return;
    }

    if (!this.selectedMemberUserId) {
      this.showWarn('Selecciona un usuario para agregar al grupo');
      return;
    }

    this.savingMember = true;

    const request$ = this.members.some(member => member.id === this.selectedMemberUserId)
      ? this.groupApiService.updateMemberPermissions(
          groupId,
          this.selectedMemberUserId,
          this.currentMember.permisos
        )
      : this.groupApiService.addMember(groupId, {
          userId: this.selectedMemberUserId,
          permissions: this.currentMember.permisos
        });

    request$.subscribe({
      next: () => {
        this.showSuccess('Miembro actualizado correctamente');
        this.memberDialogVisible = false;
        this.currentMember = this.emptyMember();
        this.selectedMemberUserId = '';
        this.loadGroups(groupId);
        this.loadMembers(groupId);
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo guardar el miembro');
        this.savingMember = false;
      },
      complete: () => {
        this.savingMember = false;
      }
    });
  }

  deleteMember(member: Member): void {
    const groupId = this.selectedGroupId;
    if (!groupId) return;

    this.deletingMemberId = member.id;

    this.groupApiService.removeMember(groupId, member.id).subscribe({
      next: () => {
        this.showSuccess('Miembro eliminado correctamente');
        this.loadGroups(groupId);
        this.loadMembers(groupId);
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo eliminar el miembro');
        this.deletingMemberId = null;
      },
      complete: () => {
        this.deletingMemberId = null;
      }
    });
  }

  openNewTicket(): void {
    if (!this.selectedGroupId) {
      this.showWarn('Selecciona un grupo antes de crear tickets');
      return;
    }

    this.currentTicket = this.emptyTicket();
    this.ticketDialogVisible = true;
  }

  editTicket(ticket: Ticket): void {
    this.currentTicket = {
      ...ticket,
      comentarios: [...ticket.comentarios],
      historial: [...ticket.historial]
    };
    this.ticketDialogVisible = true;
  }

  onTicketStatusChange(statusId: string): void {
    const selectedStatus = this.ticketStatuses.find(status => status.id === statusId);
    if (!selectedStatus) return;

    this.currentTicket.estadoId = selectedStatus.id;
    this.currentTicket.estado = this.getDisplayStatusName(selectedStatus.nombre);
  }

  onTicketPriorityChange(priorityId: string): void {
    const selectedPriority = this.ticketPriorities.find(priority => priority.id === priorityId);
    if (!selectedPriority) return;

    this.currentTicket.prioridadId = selectedPriority.id;
    this.currentTicket.prioridad = selectedPriority.nombre;
  }

  onTicketAssigneeChange(assigneeId: string): void {
    const selectedAssignee = this.members.find(member => member.id === assigneeId);

    this.currentTicket.asignadoId = assigneeId || null;
    this.currentTicket.asignadoA = selectedAssignee?.nombre || '';
  }

  saveTicket(): void {
    if (this.savingTicket) return;

    if (!this.selectedGroupId) {
      this.showWarn('Selecciona un grupo antes de guardar tickets');
      return;
    }

    if (!this.currentUserId) {
      this.showWarn('No se pudo resolver el usuario actual');
      return;
    }

    if (
      !this.currentTicket.titulo.trim() ||
      !this.currentTicket.descripcion.trim() ||
      !this.currentTicket.prioridad.trim()
    ) {
      this.showWarn('Completa título, descripción y prioridad del ticket');
      return;
    }

    this.savingTicket = true;

    if (!this.currentTicket.id) {
      this.ticketApiService
        .createTicket({
          groupId: this.selectedGroupId,
          titulo: this.currentTicket.titulo.trim(),
          descripcion: this.currentTicket.descripcion.trim(),
          autorId: this.currentUserId,
          asignadoId: this.currentTicket.asignadoId,
          estadoNombre: this.normalizeStatusForApi(this.currentTicket.estado),
          prioridadNombre: this.currentTicket.prioridad,
          fechaFinal: this.currentTicket.fechaLimite || null,
        })
        .subscribe({
          next: () => {
            this.showSuccess('Ticket creado correctamente');
            this.ticketDialogVisible = false;
            this.currentTicket = this.emptyTicket();
            this.refreshTicketsForSelectedGroup();
          },
          error: (error) => {
            this.handleHttpError(error, 'No se pudo crear el ticket');
            this.savingTicket = false;
          },
          complete: () => {
            this.savingTicket = false;
          }
        });
      return;
    }

    const originalTicket = this.ticketsList.find(ticket => ticket.id === this.currentTicket.id);
    const statusChanged =
      !!originalTicket &&
      this.normalizeStatusForApi(originalTicket.estado) !==
        this.normalizeStatusForApi(this.currentTicket.estado);

    this.ticketApiService
      .updateTicket(this.currentTicket.id, {
        titulo: this.currentTicket.titulo.trim(),
        descripcion: this.currentTicket.descripcion.trim(),
        asignadoId: this.currentTicket.asignadoId,
        prioridadNombre: this.currentTicket.prioridad,
        fechaFinal: this.currentTicket.fechaLimite || null,
      })
      .subscribe({
        next: () => {
          if (statusChanged) {
            this.ticketApiService
              .updateTicketStatus(this.currentTicket.id, {
                performedByUserId: this.currentUserId,
                estadoNombre: this.normalizeStatusForApi(this.currentTicket.estado),
              })
              .subscribe({
                next: () => {
                  this.showSuccess('Ticket actualizado correctamente');
                  this.ticketDialogVisible = false;
                  this.currentTicket = this.emptyTicket();
                  this.refreshTicketsForSelectedGroup();
                },
                error: (error) => {
                  this.handleHttpError(
                    error,
                    'Se guardó el ticket, pero no se pudo cambiar el estado'
                  );
                  this.ticketDialogVisible = false;
                  this.currentTicket = this.emptyTicket();
                  this.refreshTicketsForSelectedGroup();
                  this.savingTicket = false;
                },
                complete: () => {
                  this.savingTicket = false;
                }
              });
            return;
          }

          this.showSuccess('Ticket actualizado correctamente');
          this.ticketDialogVisible = false;
          this.currentTicket = this.emptyTicket();
          this.refreshTicketsForSelectedGroup();
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo actualizar el ticket');
          this.savingTicket = false;
        },
        complete: () => {
          if (!statusChanged) {
            this.savingTicket = false;
          }
        }
      });
  }

  deleteTicket(ticket: Ticket): void {
    this.deletingTicketId = ticket.id;

    this.ticketApiService.deleteTicket(ticket.id).subscribe({
      next: () => {
        this.showSuccess('Ticket eliminado correctamente');
        this.refreshTicketsForSelectedGroup();
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo eliminar el ticket');
        this.deletingTicketId = null;
      },
      complete: () => {
        this.deletingTicketId = null;
      }
    });
  }

  setView(view: 'grupo' | 'tickets'): void {
    this.currentView = view;
  }

  setTicketView(view: 'lista' | 'kanban'): void {
    this.ticketView = view;
  }

  applyTicketFilters(): void {
    this.ticketPage = 1;
    this.refreshTicketsForSelectedGroup();
  }

  clearTicketFilters(): void {
    this.ticketPage = 1;
    this.ticketSearch = '';
    this.ticketEstadoNombre = '';
    this.ticketPrioridadNombre = '';
    this.ticketAssignedUserId = '';
    this.ticketSortBy = 'fecha';
    this.ticketSortDir = 'desc';
    this.refreshTicketsForSelectedGroup();
  }

  onTicketPageChange(event: { page?: number; rows?: number }): void {
    this.ticketPage = (event.page ?? 0) + 1;
    this.ticketLimit = event.rows ?? this.ticketLimit;
    this.refreshTicketsForSelectedGroup();
  }

  openTicketDetail(ticket: Ticket): void {
    this.ticketDetailVisible = true;
    this.loadingTicketDetail = true;
    this.selectedTicket = {
      ...ticket,
      comentarios: [...ticket.comentarios],
      historial: [...ticket.historial]
    };
    this.newComment = '';

    this.ticketApiService.getTicket(ticket.id).subscribe({
      next: (response) => {
        this.selectedTicket = this.mapApiTicketDetail(response.data);
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo cargar el detalle del ticket');
      },
      complete: () => {
        this.loadingTicketDetail = false;
      }
    });
  }

  openTicketDetailFromList(ticket: Ticket): void {
    this.openTicketDetail(ticket);
  }

  addComment(): void {
    if (this.savingComment) return;

    if (!this.selectedTicket.id || !this.newComment.trim()) return;

    if (!this.currentUserId) {
      this.showWarn('No se pudo resolver el usuario actual');
      return;
    }

    this.savingComment = true;

    this.ticketApiService
      .addComment(this.selectedTicket.id, {
        autorId: this.currentUserId,
        contenido: this.newComment.trim(),
      })
      .subscribe({
        next: () => {
          const ticketId = this.selectedTicket.id;
          this.newComment = '';
          this.showSuccess('Comentario agregado correctamente');
          this.refreshTicketsForSelectedGroup();
          this.openTicketDetail({ ...this.selectedTicket, id: ticketId });
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo agregar el comentario');
          this.savingComment = false;
        },
        complete: () => {
          this.savingComment = false;
        }
      });
  }

  drop(event: CdkDragDrop<Ticket[]>, nuevoEstado: string): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      return;
    }

    const ticketMovido = event.previousContainer.data[event.previousIndex];
    if (!ticketMovido || !this.currentUserId) {
      this.showWarn('No se pudo mover el ticket');
      return;
    }

    this.ticketApiService
      .updateTicketStatus(ticketMovido.id, {
        performedByUserId: this.currentUserId,
        estadoNombre: this.normalizeStatusForApi(nuevoEstado),
      })
      .subscribe({
        next: () => {
          this.showSuccess('Estado del ticket actualizado');
          this.refreshTicketsForSelectedGroup();
          if (this.ticketDetailVisible && this.selectedTicket.id === ticketMovido.id) {
            this.openTicketDetail(ticketMovido);
          }
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudo mover el ticket');
          this.refreshTicketsForSelectedGroup();
        }
      });
  }

  getStatusIcon(status: string): string {
    const normalizedStatus = this.normalizeStatusForApi(status);

    const map: Record<string, string> = {
      Pendiente: 'pi pi-clock',
      'En progreso': 'pi pi-spin pi-cog',
      Revision: 'pi pi-search',
      Realizado: 'pi pi-check-circle'
    };

    return map[normalizedStatus] || 'pi pi-ticket';
  }

  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      Urgente: 'pi pi-exclamation-circle',
      Alta: 'pi pi-angle-double-up',
      Media: 'pi pi-minus',
      Baja: 'pi pi-angle-double-down'
    };

    return map[priority] || 'pi pi-flag';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      Urgente: 'priority-high',
      Alta: 'priority-high',
      Media: 'priority-medium',
      Baja: 'priority-low'
    };

    return map[priority] || '';
  }

  getStatusClass(status: string): string {
    const normalizedStatus = this.normalizeStatusForApi(status);

    const map: Record<string, string> = {
      Pendiente: 'status-pending',
      'En progreso': 'status-progress',
      Revision: 'status-review',
      Realizado: 'status-done'
    };

    return map[normalizedStatus] || '';
  }

  getMemberRoleIcon(role: string): string {
    const roleText = role.toLowerCase();

    if (roleText.includes('manager')) return 'pi pi-briefcase';
    if (roleText.includes('superadmin')) return 'pi pi-shield';
    if (roleText.includes('developer')) return 'pi pi-code';
    if (roleText.includes('support')) return 'pi pi-comments';

    return 'pi pi-user';
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

  private resolveCurrentUserIdAndBootstrap(): void {
    const currentUser = this.permissionService.getUser();

    this.userApiService.listUsers().subscribe({
      next: (response) => {
        this.availableUsers = response.data;

        const matchedUser = response.data.find(
          user =>
            user.username === currentUser?.username ||
            user.email === currentUser?.email
        );

        this.currentUserId = matchedUser?.id || '';
        this.loadPermissions();
        this.loadTicketCatalogs();
        this.loadGroups();
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo cargar el catálogo de usuarios');
      }
    });
  }

  private loadGroups(preferredGroupId?: string): void {
    this.loadingGroups = true;

    const shouldLoadAllGroups = this.permissionService.hasPermission('group:manage');

    this.groupApiService.listGroups({
      memberUserId: shouldLoadAllGroups ? undefined : this.currentUserId || undefined,
    }).subscribe({
      next: (response) => {
        this.groups = response.data.map(group => this.mapApiGroup(group));

        const nextSelectedId =
          preferredGroupId && this.groups.some(group => group.id === preferredGroupId)
            ? preferredGroupId
            : this.selectedGroupId && this.groups.some(group => group.id === this.selectedGroupId)
              ? this.selectedGroupId
              : this.groups[0]?.id || null;

        this.selectedGroupId = nextSelectedId;

        if (nextSelectedId) {
          this.permissionService.refreshPermissionsForGroup(nextSelectedId);
          this.loadMembers(nextSelectedId);
          this.loadTickets(nextSelectedId);
          this.loadTicketStats(nextSelectedId);
        } else {
          this.members = [];
          this.ticketsList = [];
          this.ticketStats = this.emptyTicketStats();
        }
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar los grupos');
        this.loadingGroups = false;
      },
      complete: () => {
        this.loadingGroups = false;
      }
    });
  }

  private loadMembers(groupId: string): void {
    this.loadingMembers = true;

    this.groupApiService.listMembers(groupId).subscribe({
      next: (response) => {
        this.members = response.data.map(member => this.mapApiMember(member));
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar los miembros del grupo');
        this.loadingMembers = false;
      },
      complete: () => {
        this.loadingMembers = false;
      }
    });
  }

  private loadPermissions(): void {
    this.groupApiService.listPermissionCatalog().subscribe({
      next: (response) => {
        this.availablePermissions = response.data.map(
          permission =>
            this.permissionService.normalizePermissionName(permission.nombre) as AppPermission
        );
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudo cargar el catálogo de permisos');
      }
    });
  }

  private loadTicketCatalogs(): void {
    forkJoin({
      statuses: this.ticketApiService.listStatuses(),
      priorities: this.ticketApiService.listPriorities(),
    }).subscribe({
      next: ({ statuses, priorities }) => {
        this.ticketStatuses = statuses.data;
        this.ticketPriorities = priorities.data;
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar los catálogos de tickets');
      }
    });
  }

  private loadTickets(groupId: string): void {
    this.loadingTickets = true;

    this.ticketApiService
      .listTickets({
        groupId,
        page: this.ticketPage,
        limit: this.ticketLimit,
        sortBy: this.ticketSortBy,
        sortDir: this.ticketSortDir,
        estadoNombre: this.ticketEstadoNombre || undefined,
        prioridadNombre: this.ticketPrioridadNombre || undefined,
        assignedUserId: this.ticketAssignedUserId || undefined,
        search: this.ticketSearch.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.ticketsList = response.data.items.map(ticket => this.mapApiTicket(ticket));
          this.ticketTotal = response.data.pagination.total;
          this.ticketPage = response.data.pagination.page;
          this.ticketLimit = response.data.pagination.limit;
          this.updateGroupTicketCount(groupId, response.data.pagination.total);
        },
        error: (error) => {
          this.handleHttpError(error, 'No se pudieron cargar los tickets');
          this.loadingTickets = false;
        },
        complete: () => {
          this.loadingTickets = false;
        }
      });
  }

  private loadTicketStats(groupId: string): void {
    this.ticketApiService.getStats({ groupId }).subscribe({
      next: (response) => {
        this.ticketStats = response.data;
        this.updateGroupTicketCount(groupId, response.data.summary.total);
      },
      error: (error) => {
        this.handleHttpError(error, 'No se pudieron cargar las estadísticas de tickets');
      }
    });
  }

  private refreshTicketsForSelectedGroup(): void {
    if (!this.selectedGroupId) return;

    this.loadTickets(this.selectedGroupId);
    this.loadTicketStats(this.selectedGroupId);
  }

  private mapApiGroup(group: ApiGroupSummary): Group {
    const integrantes = Number(group.membersCount || 0);

    return {
      id: group.id,
      nombre: group.nombre,
      descripcion: group.descripcion || '',
      autor: group.creadorNombreCompleto || group.creadorUsername || 'Sin autor',
      nivel: this.getGroupLevel(integrantes),
      integrantes,
      tickets: 0,
      creadorId: group.creadorId,
    };
  }

  private mapApiMember(member: ApiGroupMember): Member {
    const permisos = this.permissionService.normalizePermissions(member.permissions || []);

    return {
      id: member.userId,
      nombre: member.fullName || member.username,
      email: member.email,
      rol: this.getRoleFromPermissions(permisos),
      permisos,
    };
  }

  private mapApiTicket(ticket: ApiTicketListItem): Ticket {
    return {
      id: ticket.id,
      titulo: ticket.titulo,
      descripcion: ticket.descripcion || 'Sin descripción',
      estado: this.getDisplayStatusName(ticket.statusName),
      estadoId: ticket.statusId,
      prioridad: ticket.priorityName,
      prioridadId: ticket.priorityId,
      asignadoA: ticket.assignedFullName || ticket.assignedUsername || 'Sin asignar',
      asignadoId: ticket.assignedId,
      fechaCreacion: this.toDateInputValue(ticket.createdAt),
      fechaLimite: this.toDateInputValue(ticket.fechaFinal),
      comentarios: [],
      historial: [],
    };
  }

  private mapApiTicketDetail(ticket: ApiTicketDetail): Ticket {
    return {
      ...this.mapApiTicket(ticket),
      comentarios: ticket.comments.map(comment => this.mapApiTicketComment(comment)),
      historial: ticket.history.map(history => this.mapApiTicketHistory(history)),
    };
  }

  private mapApiTicketComment(comment: ApiTicketComment): TicketComment {
    return {
      id: comment.id,
      autor: comment.authorFullName || comment.authorUsername || comment.authorEmail,
      mensaje: comment.contenido,
      fecha: this.formatDateTime(comment.createdAt),
    };
  }

  private mapApiTicketHistory(history: ApiTicketHistory): TicketHistory {
    const messageFromDetails =
      typeof history.details?.['mensaje'] === 'string'
        ? history.details['mensaje']
        : null;

    return {
      id: history.id,
      accion: messageFromDetails || history.action,
      fecha: this.formatDateTime(history.createdAt),
    };
  }

  private updateGroupTicketCount(groupId: string, total: number): void {
    this.groups = this.groups.map(group =>
      group.id === groupId
        ? {
            ...group,
            tickets: total,
          }
        : group
    );
  }

  private toDateInputValue(value: string | null): string {
    if (!value) {
      return '';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value.split('T')[0] || value;
    }

    return parsedDate.toISOString().split('T')[0];
  }

  private formatDateTime(value: string | null): string {
    if (!value) {
      return 'Sin fecha';
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getDisplayStatusName(statusName: string): string {
    const map: Record<string, string> = {
      Revision: 'Revisión',
      Realizado: 'Finalizado',
    };

    return map[statusName] || statusName;
  }

  private normalizeStatusForApi(statusName: string): string {
    const map: Record<string, string> = {
      Revisión: 'Revision',
      Finalizado: 'Realizado',
    };

    return map[statusName] || statusName;
  }

  private getStatusCount(statusName: string): number {
    return this.ticketStats.byStatus
      .filter(status => this.normalizeStatusForApi(status.nombre) === statusName)
      .reduce((total, status) => total + status.total, 0);
  }

  private getGroupLevel(membersCount: number): string {
    if (membersCount >= 5) return 'Alto';
    if (membersCount >= 3) return 'Medio';
    return 'Base';
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

    if (permissions.length === 0) {
      return 'Sin permisos';
    }

    return 'Colaborador';
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
