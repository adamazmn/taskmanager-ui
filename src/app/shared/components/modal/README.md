# Universal Modal Component

A reusable modal component that can be used throughout the application for displaying success, error, warning, confirmation, and info messages.

## Usage

### Import the Component

```typescript
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  // ...
})
```

### Basic Example

```typescript
export class ExampleComponent {
  showModal = false;
  modalConfig: ModalConfig = {
    type: 'success',
    message: 'Operation completed successfully!',
    showClose: true
  };

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }
}
```

```html
<app-modal
  [isOpen]="showModal"
  [config]="modalConfig"
  (close)="closeModal()">
</app-modal>
```

### Confirmation Modal Example

```typescript
export class ExampleComponent {
  showConfirmModal = false;
  confirmModalConfig: ModalConfig = {
    type: 'confirmation',
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    showClose: false,
    showYes: true,
    showNo: true,
    yesText: 'Yes',
    noText: 'No'
  };

  onConfirmYes() {
    // Handle confirmation
    this.showConfirmModal = false;
  }

  onConfirmNo() {
    this.showConfirmModal = false;
  }
}
```

```html
<app-modal
  [isOpen]="showConfirmModal"
  [config]="confirmModalConfig"
  (close)="showConfirmModal = false"
  (yes)="onConfirmYes()"
  (no)="onConfirmNo()">
</app-modal>
```

## Modal Types

- `success` - Green circle with checkmark
- `error` - Red triangle with exclamation mark
- `warning` - Yellow triangle with exclamation mark

## Button Colors

- **Close/Yes buttons**: Yellow background (#ffff00) with black text
- **No button**: White background with black text

## Configuration Options

```typescript
interface ModalConfig {
  type: 'success' | 'error' | 'warning';
  title?: string;              // Optional custom title
  message: string;              // Required message text
  showClose?: boolean;         // Show close button (default: true)
  showYes?: boolean;           // Show Yes button (default: false)
  showNo?: boolean;            // Show No button (default: false)
  closeText?: string;           // Close button text (default: 'Close')
  yesText?: string;            // Yes button text (default: 'Yes')
  noText?: string;             // No button text (default: 'No')
  icon?: string;               // Custom icon character
}
```

## Events

- `close` - Emitted when Close button is clicked or overlay is clicked
- `yes` - Emitted when Yes button is clicked
- `no` - Emitted when No button is clicked

