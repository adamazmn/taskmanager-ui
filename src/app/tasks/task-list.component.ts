import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TaskService } from '../services/task.service';
import { AuthService } from '../services/auth.service';
import { Task } from '../models/task.model';
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ModalComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss']
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  filterStatus: 'all' | 'pending' | 'done' = 'all';
  filterDateAdded: string = '';
  filterDueDate: string = '';
  isLoadingTasks = false;
  isSubmitting = false;
  showModal = false;
  isEditing = false;
  editingTaskId: string | null = null;
  showStatusConfirmModal = false;
  showDeleteConfirmModal = false;
  selectedTaskForStatusChange: Task | null = null;
  taskToDelete: string | null = null;

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
  taskForm!: FormGroup;
  selectedFiles: File[] = [];
  filePreviews: { file: File; preview: string }[] = [];
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
    private router: Router
  ) {
    this.initForm();
    const username = this.authService.getUsername();
    if (username) {
      this.currentUser.username = username;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
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
            this.tasks[index] = { ...this.tasks[index], ...updatedTaskData };
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
        this.taskService.updateTask(updateDto).subscribe({
          next: (response: any) => {
            console.log('Update response (Form):', response);
            const updatedTask = response.data;
            
            // Normalize
            updatedTask.status = updatedTask.status ? updatedTask.status.toLowerCase() : updatedTask.status;

            const index = this.tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
              this.tasks[index] = { ...this.tasks[index], ...updatedTask };
              this.applyFilter();
            }
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
        // Use FormData handling via service
        this.taskService.createTask(createDto, this.selectedFiles[0]).subscribe({
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
