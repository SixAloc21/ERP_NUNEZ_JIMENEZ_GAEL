import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div style="height:100vh; display:flex; justify-content:center; align-items:center; flex-direction:column; gap:12px;">
      <h2>Home / Dashboard</h2>

      <p-button label="Cerrar sesión" severity="danger" (onClick)="logout()"></p-button>
    </div>
  `,
})
export class HomeComponent {
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/auth/login']);
  }
}