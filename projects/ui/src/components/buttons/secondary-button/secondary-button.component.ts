import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { BUTTON_SIZE_PADDINGS } from '../buttons.config';

@Component({
  selector: 'button[secondaryButton], a[secondaryButton]',
  template: ` <ng-container *ngIf="!loading">
      <ng-content></ng-content>
    </ng-container>
    <ng-container *ngIf="loading">
      <cartella-button-loader></cartella-button-loader>
    </ng-container>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryButtonComponent {
  @HostBinding('class') get classes() {
    return `btn-secondary rounded-md
     border border-gray-100
     flex items-center
     bg-gray-50
     dark:bg-dark-700
     ${BUTTON_SIZE_PADDINGS[this.size]}
     ${this.size === 'sm' ? 'text-sm' : 'text-base'}
     text-gray-600
     dark:text-gray-50
     hover:bg-gray-100
     dark:hover:bg-dark-800
     hover:text-gray-800
     dark:hover:text-white
     focus:outline-none
     focus:border-primary
     focus:ring-primary focus:ring-1
     `;
  }

  @Input() size: 'sm' | 'lg' = 'lg';
  @Input() loading = false;
}
