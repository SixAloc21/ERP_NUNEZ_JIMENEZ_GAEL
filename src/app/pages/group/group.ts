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
})
export class GroupComponent {

  groups: Group[] = [];

  dialogVisible = false;

  currentGroup: Group = this.emptyGroup();

  private idCounter = 1;

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

  openNew() {
    this.currentGroup = this.emptyGroup();
    this.dialogVisible = true;
  }

  editGroup(group: Group) {
    this.currentGroup = { ...group };
    this.dialogVisible = true;
  }

  saveGroup() {
    if (this.currentGroup.id === 0) {
      this.currentGroup.id = this.idCounter++;
      this.groups.push({ ...this.currentGroup });
    } else {
      const index = this.groups.findIndex(g => g.id === this.currentGroup.id);
      this.groups[index] = { ...this.currentGroup };
    }

    this.dialogVisible = false;
  }

  deleteGroup(group: Group) {
    this.groups = this.groups.filter(g => g.id !== group.id);
  }
}