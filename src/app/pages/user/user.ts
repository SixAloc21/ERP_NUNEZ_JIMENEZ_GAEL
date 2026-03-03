import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

type Perfil = {
  usuario: string;
  email: string;
  nombreCompleto: string;
  direccion: string;
  telefono: string;
  fechaNacimiento: string;
};

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
  ],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent {
  // ✅ READ (datos mostrados)
  perfil: Perfil = {
    usuario: 'Gael',
    email: 'gael@email.com',
    nombreCompleto: 'Gael Martínez López',
    direccion: 'Av. Siempre Viva 742',
    telefono: '4421234567',
    fechaNacimiento: '2003-05-18',
  };

  // ✅ UPDATE (modal)
  modalVisible = false;
  editPerfil: Perfil = { ...this.perfil };

  abrirEditar() {
    this.editPerfil = { ...this.perfil };
    this.modalVisible = true;
  }

  guardarCambios() {
    this.perfil = { ...this.editPerfil };
    this.modalVisible = false;
  }

  // ✅ DELETE (limpiar perfil)
  eliminarPerfil() {
    this.perfil = {
      usuario: '',
      email: '',
      nombreCompleto: '',
      direccion: '',
      telefono: '',
      fechaNacimiento: '',
    };
  }
}