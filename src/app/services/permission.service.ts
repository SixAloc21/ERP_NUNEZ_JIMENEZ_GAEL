import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionService {

  constructor(private auth: AuthService) {}

  has(permission: string): boolean {
    const user = this.auth.getUser();
    return !!user?.permissions?.includes(permission);
  }
}