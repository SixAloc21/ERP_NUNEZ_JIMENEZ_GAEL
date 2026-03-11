import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

interface Group {
  id: number;
  nivel: string;
  autor: string;
  nombre: string;
  integrantes: number;
  tickets: number;
  descripcion: string;
}

interface Member {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface TicketComment {
  id: number;
  autor: string;
  mensaje: string;
  fecha: string;
}

interface TicketHistory {
  id: number;
  accion: string;
  fecha: string;
}

interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  asignadoA: string;
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
    FormsModule,
    DragDropModule,
    TooltipModule
  ],
  templateUrl: './group.html',
  styleUrls: ['./group.css']
})
export class GroupComponent {
  groups: Group[] = [
    {
      id: 1,
      nombre: 'Frontend Team',
      nivel: 'Avanzado',
      autor: 'Gael',
      integrantes: 4,
      tickets: 3,
      descripcion: 'Grupo encargado de la parte visual del sistema'
    }
  ];

  members: Member[] = [
    { id: 1, nombre: 'Gael', email: 'gael@email.com', rol: 'Líder' },
    { id: 2, nombre: 'Ana', email: 'ana@email.com', rol: 'Frontend Dev' },
    { id: 3, nombre: 'Luis', email: 'luis@email.com', rol: 'UI Designer' },
    { id: 4, nombre: 'Mario', email: 'mario@email.com', rol: 'Tester' }
  ];

  ticketsList: Ticket[] = [
    {
      id: 1,
      titulo: 'Login responsive',
      descripcion: 'Hacer responsive la pantalla de login',
      estado: 'Pendiente',
      prioridad: 'Alta',
      asignadoA: 'Ana',
      fechaCreacion: '2026-03-07',
      fechaLimite: '2026-03-10',
      comentarios: [
        {
          id: 1,
          autor: 'Gael',
          mensaje: 'Revisar primero la vista en móvil.',
          fecha: '2026-03-07 10:00'
        }
      ],
      historial: [
        {
          id: 1,
          accion: 'Ticket creado',
          fecha: '2026-03-07 09:00'
        },
        {
          id: 2,
          accion: 'Asignado a Ana',
          fecha: '2026-03-07 09:15'
        }
      ]
    },
    {
      id: 2,
      titulo: 'Sidebar dinámico',
      descripcion: 'Ajustar el sidebar según el usuario',
      estado: 'En progreso',
      prioridad: 'Media',
      asignadoA: 'Gael',
      fechaCreacion: '2026-03-06',
      fechaLimite: '2026-03-11',
      comentarios: [
        {
          id: 1,
          autor: 'Ana',
          mensaje: 'Ya se conectó con el usuario logueado.',
          fecha: '2026-03-06 13:20'
        }
      ],
      historial: [
        {
          id: 1,
          accion: 'Ticket creado',
          fecha: '2026-03-06 08:40'
        },
        {
          id: 2,
          accion: 'Estado cambiado a En progreso',
          fecha: '2026-03-06 12:00'
        }
      ]
    },
    {
      id: 3,
      titulo: 'Vista dashboard',
      descripcion: 'Completar diseño principal del dashboard',
      estado: 'Finalizado',
      prioridad: 'Baja',
      asignadoA: 'Luis',
      fechaCreacion: '2026-03-05',
      fechaLimite: '2026-03-09',
      comentarios: [
        {
          id: 1,
          autor: 'Luis',
          mensaje: 'Diseño terminado y validado.',
          fecha: '2026-03-08 17:40'
        }
      ],
      historial: [
        {
          id: 1,
          accion: 'Ticket creado',
          fecha: '2026-03-05 11:10'
        },
        {
          id: 2,
          accion: 'Estado cambiado a Finalizado',
          fecha: '2026-03-08 17:35'
        }
      ]
    }
  ];

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

  selectedGroupId: number | null = 1;
  newComment = '';

  private idCounter = 2;
  private memberIdCounter = 5;
  private ticketIdCounter = 4;
  private commentIdCounter = 2;
  private historyIdCounter = 3;

  emptyGroup(): Group {
    return {
      id: 0,
      nivel: '',
      autor: '',
      nombre: '',
      integrantes: 0,
      tickets: 0,
      descripcion: ''
    };
  }

  emptyMember(): Member {
    return {
      id: 0,
      nombre: '',
      email: '',
      rol: ''
    };
  }

  emptyTicket(): Ticket {
    return {
      id: 0,
      titulo: '',
      descripcion: '',
      estado: 'Pendiente',
      prioridad: 'Media',
      asignadoA: '',
      fechaCreacion: this.today(),
      fechaLimite: '',
      comentarios: [],
      historial: []
    };
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  now(): string {
    return new Date().toLocaleString();
  }

  get selectedGroup(): Group | null {
    if (!this.groups.length) return null;

    const found = this.groups.find(g => g.id === this.selectedGroupId);
    return found ?? this.groups[0];
  }

  selectGroup(group: Group) {
    this.selectedGroupId = group.id;
  }

  isSelectedGroup(group: Group): boolean {
    return this.selectedGroup?.id === group.id;
  }

  openNew() {
    this.currentGroup = this.emptyGroup();
    this.dialogVisible = true;
  }

  editGroup(group: Group) {
    this.currentGroup = { ...group };
    this.dialogVisible = true;
  }

  saveGroup() {
    if (
      !this.currentGroup.nombre.trim() ||
      !this.currentGroup.nivel.trim() ||
      !this.currentGroup.autor.trim() ||
      !this.currentGroup.descripcion.trim()
    ) {
      return;
    }

    const integrantesActuales = this.members.length;
    const ticketsActuales = this.ticketsList.length;

    if (this.currentGroup.id === 0) {
      this.currentGroup.id = this.idCounter++;
      this.currentGroup.integrantes = integrantesActuales;
      this.currentGroup.tickets = ticketsActuales;

      this.groups.push({ ...this.currentGroup });
      this.selectedGroupId = this.currentGroup.id;
    } else {
      const index = this.groups.findIndex(g => g.id === this.currentGroup.id);

      if (index !== -1) {
        this.currentGroup.integrantes = integrantesActuales;
        this.currentGroup.tickets = ticketsActuales;
        this.groups[index] = { ...this.currentGroup };
        this.selectedGroupId = this.currentGroup.id;
      }
    }

    this.dialogVisible = false;
  }

  deleteGroup(group: Group) {
    this.groups = this.groups.filter(g => g.id !== group.id);

    if (this.selectedGroupId === group.id) {
      this.selectedGroupId = this.groups.length ? this.groups[0].id : null;
    }
  }

  openNewMember() {
    this.currentMember = this.emptyMember();
    this.memberDialogVisible = true;
  }

  editMember(member: Member) {
    this.currentMember = { ...member };
    this.memberDialogVisible = true;
  }

  saveMember() {
    if (
      !this.currentMember.nombre.trim() ||
      !this.currentMember.email.trim() ||
      !this.currentMember.rol.trim()
    ) {
      return;
    }

    if (this.currentMember.id === 0) {
      this.currentMember.id = this.memberIdCounter++;
      this.members.push({ ...this.currentMember });
    } else {
      const index = this.members.findIndex(m => m.id === this.currentMember.id);
      if (index !== -1) {
        this.members[index] = { ...this.currentMember };
      }
    }

    this.memberDialogVisible = false;
    this.syncSelectedGroupCounters();
  }

  deleteMember(member: Member) {
    this.members = this.members.filter(m => m.id !== member.id);
    this.syncSelectedGroupCounters();
  }

  openNewTicket() {
    this.currentTicket = this.emptyTicket();
    this.ticketDialogVisible = true;
  }

  editTicket(ticket: Ticket) {
    this.currentTicket = {
      ...ticket,
      comentarios: [...ticket.comentarios],
      historial: [...ticket.historial]
    };
    this.ticketDialogVisible = true;
  }

  saveTicket() {
    if (
      !this.currentTicket.titulo.trim() ||
      !this.currentTicket.descripcion.trim() ||
      !this.currentTicket.estado.trim() ||
      !this.currentTicket.prioridad.trim() ||
      !this.currentTicket.asignadoA.trim() ||
      !this.currentTicket.fechaCreacion.trim() ||
      !this.currentTicket.fechaLimite.trim()
    ) {
      return;
    }

    if (this.currentTicket.id === 0) {
      this.currentTicket.id = this.ticketIdCounter++;
      this.currentTicket.comentarios = [];
      this.currentTicket.historial = [
        {
          id: this.historyIdCounter++,
          accion: 'Ticket creado',
          fecha: this.now()
        }
      ];

      this.ticketsList.push({
        ...this.currentTicket,
        comentarios: [...this.currentTicket.comentarios],
        historial: [...this.currentTicket.historial]
      });
    } else {
      const index = this.ticketsList.findIndex(t => t.id === this.currentTicket.id);

      if (index !== -1) {
        this.currentTicket.historial = [
          ...(this.currentTicket.historial || []),
          {
            id: this.historyIdCounter++,
            accion: 'Ticket actualizado',
            fecha: this.now()
          }
        ];

        this.ticketsList[index] = {
          ...this.currentTicket,
          comentarios: [...(this.currentTicket.comentarios || [])],
          historial: [...(this.currentTicket.historial || [])]
        };
      }
    }

    this.ticketDialogVisible = false;
    this.syncSelectedGroupCounters();
  }

  deleteTicket(ticket: Ticket) {
    this.ticketsList = this.ticketsList.filter(t => t.id !== ticket.id);
    this.syncSelectedGroupCounters();
  }

  setView(view: 'grupo' | 'tickets') {
    this.currentView = view;
  }

  setTicketView(view: 'lista' | 'kanban') {
    this.ticketView = view;
  }

  openTicketDetail(ticket: Ticket) {
    this.selectedTicket = {
      ...ticket,
      comentarios: [...ticket.comentarios],
      historial: [...ticket.historial]
    };
    this.newComment = '';
    this.ticketDetailVisible = true;
  }

  openTicketDetailFromList(ticket: Ticket) {
    this.openTicketDetail(ticket);
  }

  addComment() {
    if (!this.newComment.trim()) return;

    const comentario: TicketComment = {
      id: this.commentIdCounter++,
      autor: 'Gael',
      mensaje: this.newComment.trim(),
      fecha: this.now()
    };

    this.selectedTicket.comentarios.push(comentario);
    this.selectedTicket.historial.push({
      id: this.historyIdCounter++,
      accion: `Comentario agregado por ${comentario.autor}`,
      fecha: comentario.fecha
    });

    const index = this.ticketsList.findIndex(t => t.id === this.selectedTicket.id);
    if (index !== -1) {
      this.ticketsList[index] = {
        ...this.selectedTicket,
        comentarios: [...this.selectedTicket.comentarios],
        historial: [...this.selectedTicket.historial]
      };
    }

    this.newComment = '';
  }

  get pendientes(): number {
    return this.ticketsList.filter(t => t.estado === 'Pendiente').length;
  }

  get enProgreso(): number {
    return this.ticketsList.filter(t => t.estado === 'En progreso').length;
  }

  get revision(): number {
    return this.ticketsList.filter(t => t.estado === 'Revisión').length;
  }

  get finalizados(): number {
    return this.ticketsList.filter(t => t.estado === 'Finalizado').length;
  }

  get ticketsPendientes(): Ticket[] {
    return this.ticketsList.filter(t => t.estado === 'Pendiente');
  }

  get ticketsEnProgreso(): Ticket[] {
    return this.ticketsList.filter(t => t.estado === 'En progreso');
  }

  get ticketsRevision(): Ticket[] {
    return this.ticketsList.filter(t => t.estado === 'Revisión');
  }

  get ticketsFinalizados(): Ticket[] {
    return this.ticketsList.filter(t => t.estado === 'Finalizado');
  }

  drop(event: CdkDragDrop<Ticket[]>, nuevoEstado: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const ticketMovido = event.previousContainer.data[event.previousIndex];
      const estadoAnterior = ticketMovido?.estado || '';

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      if (ticketMovido) {
        ticketMovido.estado = nuevoEstado;
        ticketMovido.historial = [
          ...(ticketMovido.historial || []),
          {
            id: this.historyIdCounter++,
            accion: `Estado cambiado de ${estadoAnterior} a ${nuevoEstado}`,
            fecha: this.now()
          }
        ];
      }
    }

    this.syncSelectedGroupCounters();
  }

  syncSelectedGroupCounters() {
    const group = this.selectedGroup;
    if (!group) return;

    const index = this.groups.findIndex(g => g.id === group.id);
    if (index !== -1) {
      this.groups[index] = {
        ...this.groups[index],
        integrantes: this.members.length,
        tickets: this.ticketsList.length
      };
    }
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      Pendiente: 'pi pi-clock',
      'En progreso': 'pi pi-spin pi-cog',
      Revisión: 'pi pi-search',
      Finalizado: 'pi pi-check-circle'
    };

    return map[status] || 'pi pi-ticket';
  }

  getPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      Alta: 'pi pi-angle-double-up',
      Media: 'pi pi-minus',
      Baja: 'pi pi-angle-double-down'
    };

    return map[priority] || 'pi pi-flag';
  }

  getPriorityClass(priority: string): string {
    const map: Record<string, string> = {
      Alta: 'priority-high',
      Media: 'priority-medium',
      Baja: 'priority-low'
    };

    return map[priority] || '';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Pendiente: 'status-pending',
      'En progreso': 'status-progress',
      Revisión: 'status-review',
      Finalizado: 'status-done'
    };

    return map[status] || '';
  }

  getMemberRoleIcon(role: string): string {
    const roleText = role.toLowerCase();

    if (roleText.includes('líder') || roleText.includes('lider')) return 'pi pi-crown';
    if (roleText.includes('designer')) return 'pi pi-palette';
    if (roleText.includes('tester')) return 'pi pi-check-square';
    if (roleText.includes('frontend')) return 'pi pi-code';

    return 'pi pi-user';
  }
}