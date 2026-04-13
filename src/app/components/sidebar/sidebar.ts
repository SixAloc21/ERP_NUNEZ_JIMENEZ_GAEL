import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../services/auth.service';
import { AppPermission } from '../../services/permission.service';

interface MenuItem {
  path: string;
  label: string;
  disabled?: boolean;
  permission?: AppPermission;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  usuario = 'Usuario';

  private allMenu: MenuSection[] = [
    {
      section: 'General',
      items: [
        { path: '/home', label: 'Dashboard' }
      ],
    },
    {
      section: 'Gestión',
      items: [
        { path: '/group', label: 'Grupos', permission: 'group:view' },
        { path: '/user', label: 'Usuarios', permission: 'user:view' },
      ],
    },
    {
      section: 'Cuenta',
      items: [
        { path: '/profile', label: 'Perfil' }
      ],
    }
  ];

  menu: MenuSection[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.buildMenu();
  }

  private loadUser(): void {
    const user = this.authService.getUser();
    this.usuario = user?.username || user?.email || 'Usuario';
  }

  private buildMenu(): void {
    this.menu = this.allMenu;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
