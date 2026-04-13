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

import { AuthService } from '../../../services/auth.service';

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
  loading = false;
  private logoClickCount = 0;

  constructor(
    private router: Router,
    private msg: MessageService,
    private authService: AuthService
  ) {}

  get canLogin(): boolean {
    return (
      this.usuario.trim().length > 0 &&
      this.password.trim().length > 0 &&
      !this.loading
    );
  }

  login(): void {
    const user = this.usuario.trim().toLowerCase();
    const password = this.password.trim();

    if (!user || !password) {
      this.msg.add({
        severity: 'warn',
        summary: 'Campos vacíos',
        detail: 'Completa usuario y contraseña',
      });
      return;
    }

    this.loading = true;

    this.authService.login({ user, password }).subscribe({
      next: (response) => {
        const loggedUsername =
          response.data?.user?.username || response.data?.user?.email || user;

        this.msg.add({
          severity: 'success',
          summary: 'Login exitoso',
          detail: `Bienvenido ${loggedUsername}`,
        });

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 500);
      },
      error: (error) => {
        console.error('Error en login:', error);

        this.msg.add({
          severity: 'error',
          summary: 'Credenciales incorrectas',
          detail: 'Usuario o contraseña inválidos',
        });

        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  onLogoClick(): void {
    this.logoClickCount += 1;

    if (this.logoClickCount < 5) {
      return;
    }

    this.logoClickCount = 0;
    this.msg.add({
      severity: 'info',
      summary: 'catch u',
      detail: 'catch u',
    });
  }
}
