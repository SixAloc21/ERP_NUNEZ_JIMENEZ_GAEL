import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { BrowserStorageService } from './browser-storage.service';

export type AppPermission =
  | 'user:view'
  | 'user:add'
  | 'user:edit'
  | 'user:edit:profile'
  | 'user:delete'
  | 'user:manage'
  | 'group:view'
  | 'group:add'
  | 'group:edit'
  | 'group:delete'
  | 'group:manage'
  | 'ticket:view'
  | 'ticket:add'
  | 'ticket:edit'
  | 'ticket:delete'
  | 'ticket:edit:state'
  | 'ticket:edit:comment'
  | 'ticket:manage'
  | 'tickets:view'
  | 'tickets:add'
  | 'tickets:edit'
  | 'tickets:delete'
  | 'tickets:move'
  | 'tickets:comment'
  | 'tickets:manage';

export interface LoggedUser {
  id?: string;
  username: string;
  email: string;
  permissions: AppPermission[];
  token?: string;
}

interface ApiResponse<T> {
  statusCode: number;
  intOpCode: string;
  data: T;
}

interface ApiGroupMember {
  userId: string;
  email: string;
  username: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly groupsApiUrl = 'http://localhost:4000/api/groups';
  private readonly permissionsChanged = new Subject<void>();
  readonly permissionsChanged$ = this.permissionsChanged.asObservable();

  private readonly legacyToCanonical: Partial<Record<AppPermission, AppPermission>> = {
    'ticket:view': 'tickets:view',
    'ticket:add': 'tickets:add',
    'ticket:edit': 'tickets:edit',
    'ticket:delete': 'tickets:delete',
    'ticket:edit:state': 'tickets:move',
    'ticket:edit:comment': 'tickets:comment',
    'ticket:manage': 'tickets:manage',
  };

  private readonly canonicalToLegacy: Partial<Record<AppPermission, AppPermission>> = {
    'tickets:view': 'ticket:view',
    'tickets:add': 'ticket:add',
    'tickets:edit': 'ticket:edit',
    'tickets:delete': 'ticket:delete',
    'tickets:move': 'ticket:edit:state',
    'tickets:comment': 'ticket:edit:comment',
    'tickets:manage': 'ticket:manage',
  };

  constructor(
    private storage: BrowserStorageService,
    private http: HttpClient
  ) {}

  private getLoggedUser(): LoggedUser | null {
    const data = this.storage.getItem('loggedUser');
    if (!data) return null;

    try {
      return JSON.parse(data) as LoggedUser;
    } catch {
      return null;
    }
  }

  getUser(): LoggedUser | null {
    const user = this.getLoggedUser();
    if (!user) return null;

    return {
      ...user,
      permissions: this.normalizePermissions(user.permissions || []),
    };
  }

  getPermissions(): AppPermission[] {
    const userPermissions = this.getUser()?.permissions || [];
    const groupPermissions = this.getActiveGroupPermissions();

    return this.normalizePermissions([...userPermissions, ...groupPermissions]);
  }

  hasPermission(permission: AppPermission): boolean {
    const userPermissions = this.getPermissions();
    const normalizedPermission = this.normalizePermissionName(permission);
    const alias = this.canonicalToLegacy[normalizedPermission];

    return (
      userPermissions.includes(normalizedPermission) ||
      (!!alias && userPermissions.includes(alias))
    );
  }

  has(permission: AppPermission): boolean {
    return this.hasPermission(permission);
  }

  hasAnyPermission(permissions: AppPermission[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.some((p) => userPermissions.includes(p));
  }

  hasAllPermissions(permissions: AppPermission[]): boolean {
    const userPermissions = this.getPermissions();
    return permissions.every((p) => userPermissions.includes(p));
  }

  clear(): void {
    this.storage.removeItem('loggedUser');
    this.storage.removeItem('token');
    this.storage.removeItem('currentGroup');
    this.storage.removeItem('activeGroupId');
    this.storage.removeItem('activeGroupPermissions');
    this.permissionsChanged.next();
  }

  refreshPermissionsForGroup(groupId: string): void {
    const currentUser = this.getLoggedUser();

    this.storage.setItem('activeGroupId', groupId);
    this.storage.setItem('activeGroupPermissions', JSON.stringify([]));
    this.permissionsChanged.next();

    if (!currentUser) {
      return;
    }

    this.http
      .get<ApiResponse<ApiGroupMember[]>>(`${this.groupsApiUrl}/${groupId}/members`)
      .subscribe({
        next: (response) => {
          const currentMember = response.data.find(member =>
            (!!currentUser.id && member.userId === currentUser.id) ||
            member.email === currentUser.email ||
            member.username === currentUser.username
          );

          const permissions = this.normalizePermissions(currentMember?.permissions || []);
          this.storage.setItem('activeGroupPermissions', JSON.stringify(permissions));
          this.permissionsChanged.next();
        },
        error: () => {
          this.storage.setItem('activeGroupPermissions', JSON.stringify([]));
          this.permissionsChanged.next();
        },
      });
  }

  private getActiveGroupPermissions(): AppPermission[] {
    const rawPermissions = this.storage.getItem('activeGroupPermissions');
    if (!rawPermissions) return [];

    try {
      const permissions = JSON.parse(rawPermissions) as string[];
      return this.normalizePermissions(permissions);
    } catch {
      return [];
    }
  }

  normalizePermissionName(permission: string): AppPermission {
    return (this.legacyToCanonical[permission as AppPermission] ||
      permission) as AppPermission;
  }

  normalizePermissions(permissions: string[]): AppPermission[] {
    const uniquePermissions = new Set<AppPermission>();

    permissions.forEach(permission => {
      const normalized = this.normalizePermissionName(permission);
      uniquePermissions.add(normalized);
    });

    return Array.from(uniquePermissions);
  }
}
