import { Injectable } from '@angular/core';
import { UserState, initialUserState } from '../state/user.state';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private user: UserState = { ...initialUserState };

  // ✅ Simulación de login (luego se reemplaza por HTTP)
  loginMock() {
    this.user = {
      name: 'Gael',
      permissions: [
        'user:view',
        'user:edit',
        'group:view',
        'ticket:view'
      ]
    };
    return this.user;
  }

  getUser(): UserState {
    return this.user;
  }

  setUser(user: UserState) {
    this.user = user;
  }

  logout() {
    this.user = { ...initialUserState };
  }
}