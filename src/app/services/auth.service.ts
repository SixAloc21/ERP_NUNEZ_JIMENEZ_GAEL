import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  loggedUser = '';
  users: any[] = [];

  constructor() {
    const savedUser = localStorage.getItem('loggedUser');
    this.loggedUser = savedUser || '';
  }

  setUsers(users: any[]) {
    this.users = users;
  }

  getCurrentUser() {
    return this.users.find(u => u.usuario === this.loggedUser);
  }

  getUser() {
    return this.getCurrentUser();
  }

  login(userName: string) {
    this.loggedUser = userName;
    localStorage.setItem('loggedUser', userName);
  }

  logout() {
    this.loggedUser = '';
    localStorage.removeItem('loggedUser');
  }

  isLoggedIn(): boolean {
    return !!this.loggedUser;
  }

  isSuperAdmin(): boolean {
    return this.getCurrentUser()?.rol === 'SuperAdmin';
  }

  hasPermission(permission: string): boolean {
    if (this.isSuperAdmin()) return true;

    const user = this.getCurrentUser();
    return user?.permisos?.includes(permission);
  }
}