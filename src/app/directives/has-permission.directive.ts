import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService, AppPermission } from '../services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {

  @Input('appHasPermission') permission!: AppPermission;
  private permissionSubscription?: Subscription;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.updateView();
    this.permissionSubscription = this.permissionService.permissionsChanged$.subscribe(() => {
      this.updateView();
    });
  }

  ngOnDestroy(): void {
    this.permissionSubscription?.unsubscribe();
  }

  private updateView(): void {
    const hasPermission = this.permissionService.has(this.permission);

    if (hasPermission) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear(); // 🔥 elimina del DOM
    }
  }
}
