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

  usuario = '';
  password = '';

  // 👇 usuarios simulados del sistema
  private readonly USERS = [
    { user: 'Gael', pass: 'Gael!2004##' }, // SuperAdmin
    { user: 'Ana', pass: 'Ana!2004##' }    // Usuario normal
  ];

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

    const foundUser = this.USERS.find(
      u => u.user === this.usuario.trim() && u.pass === this.password
    );

    if (!foundUser) {
      this.msg.add({
        severity: 'error',
        summary: 'Credenciales incorrectas',
        detail: 'Usuario o contraseña inválidos',
      });
      return;
    }

    // ✅ crear sesión
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('loggedUser', foundUser.user);

    this.msg.add({
      severity: 'success',
      summary: 'Login exitoso',
      detail: `Bienvenido ${foundUser.user}`,
    });

    setTimeout(() => this.router.navigate(['/home']), 400);
  }
}