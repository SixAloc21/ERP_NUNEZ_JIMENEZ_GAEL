import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    InputMaskModule,
    DatePickerModule,
    ToastModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
})
export class RegisterComponent {
  // Campos requeridos
  usuario = '';
  email = '';
  password = '';
  confirmPassword = '';
  nombreCompleto = '';
  direccion = '';
  telefono = '';
  fechaNacimiento: Date | null = null;

  // reglas
  private specialSymbols = '!@#$%^&*';

  constructor(private router: Router, private msg: MessageService) {}

  // -------- helpers ----------
  isEmailValid(): boolean {
    return /^\S+@\S+\.\S+$/.test(this.email);
  }

  hasSpecialSymbol(p: string): boolean {
    return [...this.specialSymbols].some(sym => p.includes(sym));
  }

  isPasswordValid(): boolean {
    return this.password.length >= 10 && this.hasSpecialSymbol(this.password);
  }

  isConfirmValid(): boolean {
    return this.password === this.confirmPassword && this.confirmPassword.length > 0;
  }

  // teléfono: solo números y 10 dígitos
  isPhoneValid(): boolean {
    const digits = (this.telefono || '').replace(/\D/g, '');
    return digits.length === 10;
  }

  // edad (>=18)
  get age(): number | null {
    if (!this.fechaNacimiento) return null;
    const today = new Date();
    let a = today.getFullYear() - this.fechaNacimiento.getFullYear();
    const m = today.getMonth() - this.fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < this.fechaNacimiento.getDate())) a--;
    return a;
  }

  isAdult(): boolean {
    return this.age !== null && this.age >= 18;
  }

  // form completo
  get canSubmit(): boolean {
    const filled =
      this.usuario.trim() &&
      this.email.trim() &&
      this.password.trim() &&
      this.confirmPassword.trim() &&
      this.nombreCompleto.trim() &&
      this.direccion.trim() &&
      this.telefono.trim() &&
      this.fechaNacimiento;

    return !!(
      filled &&
      this.isEmailValid() &&
      this.isPasswordValid() &&
      this.isConfirmValid() &&
      this.isAdult() &&
      this.isPhoneValid()
    );
  }

  register() {
    if (!this.canSubmit) {
      this.msg.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Revisa los campos (edad, contraseña, teléfono, etc.)',
      });
      return;
    }

    // ✅ Simulación (sin backend)
    // Guardamos “usuario registrado” en localStorage
    const user = {
      usuario: this.usuario,
      email: this.email,
      nombreCompleto: this.nombreCompleto,
      direccion: this.direccion,
      telefono: this.telefono,
      fechaNacimiento: this.fechaNacimiento,
    };
    localStorage.setItem('registeredUser', JSON.stringify(user));

    this.msg.add({
      severity: 'success',
      summary: 'Registro exitoso',
      detail: 'Ahora puedes iniciar sesión',
    });

    setTimeout(() => this.router.navigate(['/auth/login']), 600);
  }
}