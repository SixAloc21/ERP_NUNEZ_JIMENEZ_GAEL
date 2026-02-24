import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
    MessageModule,
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  // campos
  usuario = '';
  password = '';

  // ✅ credenciales hardcodeadas (puedes cambiarlas)
  private readonly HARD_USER = 'Gael';
  private readonly HARD_PASS = 'Gael!2004##'; // 10+ y símbolos

  constructor(private router: Router, private msg: MessageService) {}

  get canLogin(): boolean {
    return this.usuario.trim().length > 0 && this.password.trim().length > 0;
  }

  login() {
    if (!this.canLogin) {
      this.msg.add({
        severity: 'warn',
        summary: 'Campos vacíos',
        detail: 'Completa usuario y contraseña',
      });
      return;
    }

    const ok =
      this.usuario.trim() === this.HARD_USER &&
      this.password === this.HARD_PASS;

    if (!ok) {
      this.msg.add({
        severity: 'error',
        summary: 'Credenciales incorrectas',
        detail: 'Usuario o contraseña inválidos',
      });
      return;
    }

    // ✅ simular sesión
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('loggedUser', this.usuario.trim());

    this.msg.add({
      severity: 'success',
      summary: 'Login exitoso',
      detail: 'Bienvenido',
    });

    setTimeout(() => this.router.navigate(['/home']), 400);
  }
}