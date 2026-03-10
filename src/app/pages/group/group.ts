import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

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

interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  asignadoA: string;
  fechaCreacion: string;
  fechaLimite: string;
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
    FormsModule
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
      fechaLimite: '2026-03-10'
    },
    {
      id: 2,
      titulo: 'Sidebar dinámico',
      descripcion: 'Ajustar el sidebar según el usuario',
      estado: 'En progreso',
      prioridad: 'Media',
      asignadoA: 'Gael',
      fechaCreacion: '2026-03-06',
      fechaLimite: '2026-03-11'
    },
    {
      id: 3,
      titulo: 'Vista dashboard',
      descripcion: 'Completar diseño principal del dashboard',
      estado: 'Finalizado',
      prioridad: 'Baja',
      asignadoA: 'Luis',
      fechaCreacion: '2026-03-05',
      fechaLimite: '2026-03-09'
    }
  ];

  dialogVisible = false;
  memberDialogVisible = false;
  ticketDialogVisible = false;

  currentView: 'grupo' | 'tickets' = 'grupo';
  ticketView: 'lista' | 'kanban' = 'lista';

  currentGroup: Group = this.emptyGroup();
  currentMember: Member = this.emptyMember();
  currentTicket: Ticket = this.emptyTicket();

  private idCounter = 2;
  private memberIdCounter = 5;
  private ticketIdCounter = 4;

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
      fechaLimite: ''
    };
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
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
    if (!this.currentGroup.nombre.trim()) return;

    const integrantesActuales = this.members.length;
    const ticketsActuales = this.ticketsList.length;

    if (this.currentGroup.id === 0) {
      this.currentGroup.id = this.idCounter++;
      this.currentGroup.integrantes = integrantesActuales;
      this.currentGroup.tickets = ticketsActuales;
      this.groups.push({ ...this.currentGroup });
    } else {
      const index = this.groups.findIndex(g => g.id === this.currentGroup.id);
      if (index !== -1) {
        this.currentGroup.integrantes = integrantesActuales;
        this.currentGroup.tickets = ticketsActuales;
        this.groups[index] = { ...this.currentGroup };
      }
    }

    this.dialogVisible = false;
  }

  deleteGroup(group: Group) {
    this.groups = this.groups.filter(g => g.id !== group.id);
  }

  openNewMember() {
    this.currentMember = this.emptyMember();
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

  editMember(member: Member) {
    this.currentMember = { ...member };
    this.memberDialogVisible = true;
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
    this.currentTicket = { ...ticket };
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
      this.ticketsList.push({ ...this.currentTicket });
    } else {
      const index = this.ticketsList.findIndex(t => t.id === this.currentTicket.id);
      if (index !== -1) {
        this.ticketsList[index] = { ...this.currentTicket };
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

  get selectedGroup(): Group | null {
    return this.groups.length ? this.groups[0] : null;
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

  syncSelectedGroupCounters() {
    if (this.groups.length > 0) {
      this.groups[0].integrantes = this.members.length;
      this.groups[0].tickets = this.ticketsList.length;
    }
  }
}