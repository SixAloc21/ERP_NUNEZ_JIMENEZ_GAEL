import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class BrowserStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? localStorage : null;
  }

  getItem(key: string): string | null {
    return this.storage?.getItem(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage?.setItem(key, value);
  }

  removeItem(key: string): void {
    this.storage?.removeItem(key);
  }
}
