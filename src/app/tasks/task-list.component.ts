import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TaskService } from '../services/task.service';
import { AuthService } from '../services/auth.service';
import { Task, TaskAttachment } from '../models/task.model';
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';
import { SafePipe } from '../shared/pipes/safe.pipe';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ModalComponent, SafePipe],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  filterStatus: 'all' | 'pending' | 'done' = 'all';
  filterDateAdded: string = '';
  filterDueDate: string = '';
  searchQuery: string = '';
  isLoadingTasks = false;
  isSubmitting = false;
  showModal = false;
  isEditing = false;
  editingTaskId: string | null = null;
  showStatusConfirmModal = false;
  showDeleteConfirmModal = false;
  selectedTaskForStatusChange: Task | null = null;
  taskToDelete: string | null = null;
  showAttachmentModal = false;
  selectedAttachment: TaskAttachment | null = null;
  selectedTaskForAttachments: Task | null = null;
  // Mobile Menu
  isMobileMenuOpen = false;
  previewError = false;
  previewUrl: SafeResourceUrl | null = null;
  private currentObjectUrl: string | null = null;
  
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
  
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  statusConfirmModalConfig: ModalConfig = {
    type: 'warning',
    message: '',
    showClose: false,
    showYes: true,
    showNo: true,
    yesText: 'Yes',
    noText: 'No'
  };

  deleteConfirmModalConfig: ModalConfig = {
    type: 'warning',
    message: 'Are you sure you want to delete this task?',
    showClose: false,
    showYes: true,
    showNo: true,
    yesText: 'Yes',
    noText: 'No'
  };

  successModalConfig: ModalConfig = {
    type: 'success',
    message: '',
    showClose: true
  };

  errorModalConfig: ModalConfig = {
    type: 'error',
    message: '',
    showClose: true
  };

  showSuccessModal = false;
  showErrorModal = false;
  showLogoutConfirmModal = false;

  logoutConfirmModalConfig: ModalConfig = {
    type: 'warning',
    title: 'Confirm Logout',
    message: 'Are you sure you want to logout?',
    showClose: false,
    showYes: true,
    showNo: true,
    yesText: 'Yes, Logout',
    noText: 'Cancel'
  };
  taskForm!: FormGroup;
  selectedFiles: File[] = [];
  filePreviews: { file: File; preview: string }[] = [];
  private readonly apiBaseUrl = environment.apiUrl;
  currentDate: string = '';
  currentUser = {
    username: 'johndoe',
    name: 'John Doe'
  };

  constructor(
    private taskService: TaskService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    this.initForm();
    const username = this.authService.getUsername();
    if (username) {
      this.currentUser.username = username;
    }
  }

  openLogoutConfirmModal(): void {
    this.showLogoutConfirmModal = true;
  }

  onLogoutConfirmYes(): void {
    this.showLogoutConfirmModal = false;
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onLogoutConfirmNo(): void {
    this.showLogoutConfirmModal = false;
  }

  logout(): void {
    this.openLogoutConfirmModal();
  }

  toggleTheme(): void {
    document.documentElement.classList.toggle('dark');
  }

  ngOnInit(): void {
    this.loadTasks();
    this.updateDate();
  }

  updateDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    };
    this.currentDate = now.toLocaleDateString('en-US', options);
  }

  initForm(): void {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required]],
      description: ['', [Validators.required]],
      status: ['pending', Validators.required],
      dueDate: [null]
    });
  }

  openModal(): void {
    this.showModal = true;
    this.isEditing = false;
    this.editingTaskId = null;
    this.resetForm();
  }

  openEditModal(task: Task): void {
    this.showModal = true;
    this.isEditing = true;
    this.editingTaskId = task.id;
    
    // Populate form with task details
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null
    });

    this.selectedFiles = [];
    this.filePreviews = [];
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditing = false;
    this.editingTaskId = null;
    this.resetForm();
  }

  resetForm(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      status: 'pending',
      dueDate: null
    });
    this.selectedFiles = [];
    this.filePreviews = [];
  }

  loadTasks(): void {
    const username = this.authService.getUsername();
    if (!username) {
      console.error('No username found, cannot load tasks');
      return;
    }

    this.isLoadingTasks = true;
    this.taskService.getUserTaskDetail(username).subscribe({
      next: (response: any) => {
        if (response.status === '200' && response.data) {
          console.log('Tasks fetched:', response.data);
          const rawTasks = response.data.tasks || [];
          // Map backend response to frontend model
          this.tasks = rawTasks.map((t: any) => {
            let parsedAttachments = [];
            try {
              if (t.attachments && typeof t.attachments === 'string') {
                parsedAttachments = JSON.parse(t.attachments);
              } else if (Array.isArray(t.attachments)) {
                parsedAttachments = t.attachments;
              }
            } catch (e) {
              console.warn('Failed to parse attachments for task', t.id, e);
            }

            return {
              ...t,
              status: t.status ? t.status.toLowerCase() : 'pending', // Normalize status
              attachments: parsedAttachments
            };
          });

          this.currentUser.name = response.data.name || this.currentUser.name;
          this.applyFilter();
        }
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.isLoadingTasks = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    let filtered = [...this.tasks];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) || 
        task.description.toLowerCase().includes(query)
      );
    }

    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === this.filterStatus);
    }

    if (this.filterDateAdded) {
      const filterDate = new Date(this.filterDateAdded);
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toDateString() === filterDate.toDateString();
      });
    }

    if (this.filterDueDate) {
      const filterDate = new Date(this.filterDueDate);
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;
        const taskDueDate = new Date(task.dueDate);
        return taskDueDate.toDateString() === filterDate.toDateString();
      });
    }

    this.filteredTasks = filtered;
  }

  onFilterChange(status: 'all' | 'pending' | 'done'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  onDateAddedChange(date: string): void {
    this.filterDateAdded = date;
    this.applyFilter();
  }

  onDueDateChange(date: string): void {
    this.filterDueDate = date;
    this.applyFilter();
  }

  clearFilters(): void {
    this.filterStatus = 'all';
    this.filterDateAdded = '';
    this.filterDueDate = '';
    this.searchQuery = '';
    this.applyFilter();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFilter();
  }

  deleteTask(id: string): void {
    this.taskToDelete = id;
    this.showDeleteConfirmModal = true;
  }

  onDeleteConfirmYes(): void {
    if (this.taskToDelete) {
      this.taskService.deleteTask(this.taskToDelete).subscribe({
        next: (response: any) => {
          console.log('Delete response:', response);
          this.tasks = this.tasks.filter(task => task.id !== this.taskToDelete);
          this.applyFilter();
          this.showDeleteConfirmModal = false;
          this.taskToDelete = null;
          
          this.successModalConfig = {
            type: 'success',
            title: 'Delete Successful',
            message: 'Task deleted successfully!',
            showClose: true
          };
          this.showSuccessModal = true;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error deleting task:', error);
          this.showDeleteConfirmModal = false;
          this.taskToDelete = null;
          
          this.errorModalConfig = {
            type: 'error',
            title: 'Delete Failed',
            message: 'Failed to delete task. Please try again.',
            showClose: true
          };
          this.showErrorModal = true;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onDeleteConfirmNo(): void {
    this.showDeleteConfirmModal = false;
    this.taskToDelete = null;
  }

  openStatusConfirmModal(task: Task): void {
    this.selectedTaskForStatusChange = task;
    this.statusConfirmModalConfig = {
      type: 'warning',
      title: 'Confirm Status Change',
      message: `Are you sure you want to change the status of this task?\n\n"${task.title}"`,
      showClose: false,
      showYes: true,
      showNo: true,
      yesText: 'Yes',
      noText: 'No'
    };
    this.showStatusConfirmModal = true;
  }

  closeStatusConfirmModal(): void {
    this.showStatusConfirmModal = false;
    this.selectedTaskForStatusChange = null;
  }

  onStatusConfirmYes(): void {
    if (this.selectedTaskForStatusChange) {
      const task = this.selectedTaskForStatusChange;
      // Determine new status (Capitalized for Backend)
      const isCurrentlyDone = task.status && task.status.toLowerCase() === 'done';
      const newStatusForBackend = isCurrentlyDone ? 'Pending' : 'Done';
      const newStatusForFrontend = newStatusForBackend.toLowerCase();
      
      const updateDto = {
        taskId: task.id,
        title: task.title,
        description: task.description,
        status: newStatusForBackend,
        dueDate: task.dueDate
      };
      
      console.log('Parameters update:', updateDto);

      this.taskService.updateTask(updateDto).subscribe({
        next: (response: any) => {
          console.log('Update response:', response);
          // Backend returns updated task object
          const updatedTaskData = response.data;
          // Normalize status
          updatedTaskData.status = updatedTaskData.status ? updatedTaskData.status.toLowerCase() : newStatusForFrontend;

          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            // Preserve existing attachments since update doesn't change them
            // and backend returns attachments as string
            const existingAttachments = this.tasks[index].attachments;
            this.tasks[index] = { 
              ...this.tasks[index], 
              ...updatedTaskData,
              attachments: existingAttachments 
            };
            this.applyFilter();
          }
          this.closeStatusConfirmModal();
          
          this.successModalConfig = {
            type: 'success',
            title: 'Update Successful',
            message: 'Task status updated successfully!',
            showClose: true
          };
          this.showSuccessModal = true;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error updating task:', error);
          this.closeStatusConfirmModal();
          
          this.errorModalConfig = {
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update task status. Please try again.',
            showClose: true
          };
          this.showErrorModal = true;
          this.cdr.detectChanges();
        }
      });
    }
  }


  onStatusConfirmNo(): void {
    this.closeStatusConfirmModal();
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isSubmitting = true;
      const formValue = this.taskForm.value;
      
      // Sanitize form value: Convert empty dueDate to null to avoid JSON parsing errors
      const sanitizedFormValue = {
        ...formValue,
        dueDate: formValue.dueDate ? formValue.dueDate : null
      };

      // Capitalize status for Backend (Pending/Done) to match DB constraints
      const statusForBackend = sanitizedFormValue.status ? 
        sanitizedFormValue.status.charAt(0).toUpperCase() + sanitizedFormValue.status.slice(1) : null;

      if (this.isEditing && this.editingTaskId) {
        // Update existing task
        const updateDto = {
            taskId: this.editingTaskId,
            ...sanitizedFormValue,
            status: statusForBackend
        };
        console.log('Parameters update (Form):', updateDto);
        // Pass files array to update task (will replace existing attachments)
        this.taskService.updateTask(updateDto, this.selectedFiles).subscribe({
          next: (response: any) => {
            console.log('Update response (Form):', response);
            // Reload tasks to get fresh data including updated attachments
            this.loadTasks();
            this.closeModal();
            this.isSubmitting = false;
            
            this.successModalConfig = {
              type: 'success',
              title: 'Update Successful',
              message: 'Task updated successfully!',
              showClose: true
            };
            this.showSuccessModal = true;
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error updating task:', error);
            this.isSubmitting = false;
            
            this.errorModalConfig = {
              type: 'error',
              title: 'Update Failed',
              message: 'Failed to update task. Please try again.',
              showClose: true
            };
            this.showErrorModal = true;
            this.cdr.detectChanges();
          }
        });
      } else {
        // Create new task
        const createDto = {
            username: this.currentUser.username,
            ...sanitizedFormValue,
            status: statusForBackend
        };
        console.log('Parameters create:', createDto);
        // Use FormData handling via service - pass all selected files
        this.taskService.createTask(createDto, this.selectedFiles).subscribe({
          next: (response: any) => {
            console.log('Create response:', response);
            // Backend returns only ID (e.g., "cf7...") in response.data for create.
            // So we MUST reload the entire list to get the formatted Task object (dates, status, etc)
            this.loadTasks();

            this.closeModal();
            this.isSubmitting = false;
            
            this.successModalConfig = {
              type: 'success',
              title: 'Create Successful',
              message: 'Task created successfully!',
              showClose: true
            };
            this.showSuccessModal = true;
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error creating task:', error);
            this.isSubmitting = false;
            
            this.errorModalConfig = {
              type: 'error',
              title: 'Create Failed',
              message: 'Failed to create task. Please try again.',
              showClose: true
            };
            this.showErrorModal = true;
            this.cdr.detectChanges();
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched(): void {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        this.selectedFiles.push(file);
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.filePreviews.push({
              file: file,
              preview: e.target.result
            });
            this.cdr.detectChanges();
          };
          reader.readAsDataURL(file);
        } else {
          this.filePreviews.push({
            file: file,
            preview: ''
          });
          this.cdr.detectChanges();
        }
      });
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return '📎';
    if (fileType.startsWith('image/')) {
      return '🖼️';
    } else if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return '📝';
    } else {
      return '📎';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatText(type: 'bold' | 'italic' | 'list' | 'link', textarea: HTMLTextAreaElement): void {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? formattedText.length : 2;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        cursorOffset = selectedText ? formattedText.length : 1;
        break;
      case 'list':
        if (selectedText) {
          // Convert selected lines to bullet points
          const lines = selectedText.split('\n');
          formattedText = lines.map(line => `• ${line}`).join('\n');
        } else {
          formattedText = '• ';
        }
        cursorOffset = formattedText.length;
        break;
      case 'link':
        if (selectedText) {
          formattedText = `[${selectedText}](url)`;
          cursorOffset = formattedText.length - 1; // Position before closing paren
        } else {
          formattedText = '[link text](url)';
          cursorOffset = 1; // Position after opening bracket
        }
        break;
    }

    // Insert formatted text
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    
    // Update form control
    this.taskForm.patchValue({ description: newValue });
    
    // Restore focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cursorOffset;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  // Attachment viewing methods
  getAttachmentUrl(attachment: TaskAttachment): string {
    return `${this.apiBaseUrl}/files/${attachment.storedName}`;
  }

  openAttachmentPreview(task: Task): void {
    if (task.attachments && task.attachments.length > 0) {
      this.selectedTaskForAttachments = task; // Ensure reference is set
      this.showAttachmentModal = true;
      
      // Force UI update to show modal immediately
      this.cdr.detectChanges();
      
      // Auto-select first attachment without timeout
      this.selectAttachment(task.attachments[0]);
    } else {
      this.selectedTaskForAttachments = task;
      this.showAttachmentModal = true;
    }
  }

  closeAttachmentPreview(): void {
    this.showAttachmentModal = false;
    this.selectedAttachment = null;
    this.selectedTaskForAttachments = null;
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    this.previewUrl = null;
  }

  selectAttachment(attachment: TaskAttachment): void {
    this.selectedAttachment = attachment;
    this.previewError = false; // Reset error state
    
    // Clear previous preview
    if (this.currentObjectUrl) {
      URL.revokeObjectURL(this.currentObjectUrl);
      this.currentObjectUrl = null;
    }
    this.previewUrl = null;

    if (this.isPdfFile(attachment) || this.isImageFile(attachment)) {
      const url = this.getAttachmentUrl(attachment);
      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          this.currentObjectUrl = URL.createObjectURL(blob);
          this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentObjectUrl);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to fetch file for preview', err);
          this.previewError = true;
          this.cdr.detectChanges();
        }
      });
    }
  }

  downloadAttachment(attachment: TaskAttachment): void {
    const url = this.getAttachmentUrl(attachment);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  isImageFile(attachment: TaskAttachment): boolean {
    return attachment.contentType?.startsWith('image/') || false;
  }

  isPdfFile(attachment: TaskAttachment): boolean {
    return attachment.contentType === 'application/pdf';
  }

  getAttachmentIcon(attachment: TaskAttachment): string {
    if (!attachment.contentType) return 'attachment';
    if (attachment.contentType.startsWith('image/')) {
      return 'image';
    } else if (attachment.contentType.includes('pdf')) {
      return 'picture_as_pdf';
    } else if (attachment.contentType.includes('word') || attachment.contentType.includes('document')) {
      return 'description';
    } else if (attachment.contentType.includes('excel') || attachment.contentType.includes('spreadsheet')) {
      return 'table_chart';
    } else if (attachment.contentType.startsWith('video/')) {
      return 'videocam';
    } else {
      return 'attachment';
    }
  }

  get filteredActiveTasks(): Task[] {
    return this.filteredTasks.filter(task => task.status === 'pending');
  }

  get filteredCompletedTasks(): Task[] {
    return this.filteredTasks.filter(task => task.status === 'done');
  }

  get title() {
    return this.taskForm.get('title');
  }

  get description() {
    return this.taskForm.get('description');
  }

  handleSuccessModalClose() {
    this.showSuccessModal = false;
  }

  handleErrorModalClose() {
    this.showErrorModal = false;
  }
}
