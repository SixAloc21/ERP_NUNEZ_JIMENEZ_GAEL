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
import { AuthService } from '../../../services/auth.service';

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
  usuario = '';
  email = '';
  password = '';
  confirmPassword = '';
  nombreCompleto = '';
  direccion = '';
  telefono = '';
  fechaNacimiento: Date | null = null;
  loading = false;

  private specialSymbols = '!@#$%^&*';

  constructor(
    private router: Router,
    private msg: MessageService,
    private authService: AuthService
  ) {}

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

  isPhoneValid(): boolean {
    const digits = (this.telefono || '').replace(/\D/g, '');
    return digits.length === 10;
  }

  get age(): number | null {
    if (!this.fechaNacimiento) return null;

    const today = new Date();
    let a = today.getFullYear() - this.fechaNacimiento.getFullYear();
    const m = today.getMonth() - this.fechaNacimiento.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < this.fechaNacimiento.getDate())) {
      a--;
    }

    return a;
  }

  isAdult(): boolean {
    return this.age !== null && this.age >= 18;
  }

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

  register(): void {
    if (this.loading) return;

    if (!this.canSubmit) {
      this.msg.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Revisa los campos requeridos antes de continuar.',
      });
      return;
    }

    this.loading = true;
    this.authService.register({
      username: this.usuario.trim(),
      email: this.email.trim().toLowerCase(),
      nombre_completo: this.nombreCompleto.trim(),
      direccion: this.direccion.trim(),
      telefono: this.telefono.replace(/\D/g, ''),
      fecha_inicio: this.formatDate(this.fechaNacimiento),
      password: this.password.trim(),
    }).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Registro exitoso',
          detail: 'Tu cuenta fue registrada correctamente.',
        });

        setTimeout(() => {
          this.loading = false;
          this.router.navigate(['/auth/login']);
        }, 700);
      },
      error: (error) => {
        const detail =
          error?.error?.data?.message ||
          error?.error?.data?.error ||
          'No se pudo completar el registro.';

        this.msg.add({
          severity: 'error',
          summary: 'No se pudo registrar',
          detail,
        });

        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  private formatDate(date: Date | null): string | undefined {
    if (!date) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
