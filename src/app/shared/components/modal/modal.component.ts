import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ModalType = 'success' | 'error' | 'warning';

export interface ModalConfig {
  type: ModalType;
  title?: string;
  message: string;
  showClose?: boolean;
  showYes?: boolean;
  showNo?: boolean;
  closeText?: string;
  yesText?: string;
  noText?: string;
  icon?: string;
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() config: ModalConfig = {
    type: 'warning',
    message: '',
    showClose: true,
    showYes: false,
    showNo: false,
    closeText: 'Close',
    yesText: 'Yes',
    noText: 'No'
  };

  @Output() close = new EventEmitter<void>();
  @Output() yes = new EventEmitter<void>();
  @Output() no = new EventEmitter<void>();

  get modalIcon(): string {
    if (this.config.icon) {
      return this.config.icon;
    }

    switch (this.config.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'cancel';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  get modalIconContainerClass(): string {
    switch (this.config.type) {
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500';
      case 'error':
        return 'bg-rose-50 dark:bg-rose-900/20 text-rose-500';
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-500';
    }
  }

  get modalTitle(): string {
    if (this.config.title) {
      return this.config.title;
    }

    switch (this.config.type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'warning':
        return 'Warning';
      default:
        return 'Information';
    }
  }


  onClose(): void {
    this.close.emit();
  }

  onYes(): void {
    this.yes.emit();
  }

  onNo(): void {
    this.no.emit();
  }

  onOverlayClick(): void {
    this.onClose();
  }

  onModalClick(event: Event): void {
    event.stopPropagation();
  }
}

//test