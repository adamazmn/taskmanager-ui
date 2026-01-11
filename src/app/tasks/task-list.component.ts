import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TaskService } from '../services/task.service';
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
  isLoading = false;
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
    private fb: FormBuilder
  ) {
    this.initForm();
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
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
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

    // Handle attachments if they exist (simplification for now, usually requires more complex logic to show existing files)
    // For now we just reset file selection as re-uploading would be the edit action
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
    this.isLoading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    let filtered = [...this.tasks];

    // Filter by status
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === this.filterStatus);
    }

    // Filter by date added (new tasks)
    if (this.filterDateAdded) {
      const filterDate = new Date(this.filterDateAdded);
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filter by due date
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
        next: () => {
          this.tasks = this.tasks.filter(task => task.id !== this.taskToDelete);
          this.applyFilter();
          this.showDeleteConfirmModal = false;
          this.taskToDelete = null;
          this.showSuccessModal = true;
          this.successModalConfig = {
            type: 'success',
            message: 'Task deleted successfully!',
            showClose: true
          };
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.showDeleteConfirmModal = false;
          this.taskToDelete = null;
          this.showErrorModal = true;
          this.errorModalConfig = {
            type: 'error',
            message: 'Failed to delete task. Please try again.',
            showClose: true
          };
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
      const newStatus = task.status === 'pending' ? 'done' : 'pending';
      this.taskService.updateTask(task.id, { ...task, status: newStatus }).subscribe({
        next: (updatedTask) => {
          const index = this.tasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            this.applyFilter();
          }
          this.closeStatusConfirmModal();
          this.showSuccessModal = true;
          this.successModalConfig = {
            type: 'success',
            message: 'Task status updated successfully!',
            showClose: true
          };
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.closeStatusConfirmModal();
          this.showErrorModal = true;
          this.errorModalConfig = {
            type: 'error',
            message: 'Failed to update task status. Please try again.',
            showClose: true
          };
        }
      });
    }
  }

  onStatusConfirmNo(): void {
    this.closeStatusConfirmModal();
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      this.isLoading = true;
      const formValue = this.taskForm.value;

      // Convert selected files to attachment format
      const attachments = this.selectedFiles.map((file, index) => ({
        id: `file-${Date.now()}-${index}`,
        fileName: file.name,
        fileUrl: this.filePreviews[index]?.preview || URL.createObjectURL(file),
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString()
      }));

      const taskData = {
        ...formValue,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      if (this.isEditing && this.editingTaskId) {
        // Update existing task
        this.taskService.updateTask(this.editingTaskId, taskData).subscribe({
          next: (updatedTask) => {
            const index = this.tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
              this.tasks[index] = updatedTask;
              this.applyFilter();
            }
            this.closeModal();
            this.isLoading = false;
            this.showSuccessModal = true;
            this.successModalConfig = {
              type: 'success',
              message: 'Task updated successfully!',
              showClose: true
            };
          },
          error: (error) => {
            console.error('Error updating task:', error);
            this.isLoading = false;
            this.showErrorModal = true;
            this.errorModalConfig = {
              type: 'error',
              message: 'Failed to update task. Please try again.',
              showClose: true
            };
          }
        });
      } else {
        // Create new task
        this.taskService.createTask(taskData).subscribe({
          next: (newTask) => {
            this.tasks.push(newTask);
            this.applyFilter();
            this.closeModal();
            this.isLoading = false;
            this.showSuccessModal = true;
            this.successModalConfig = {
              type: 'success',
              message: 'Task created successfully!',
              showClose: true
            };
          },
          error: (error) => {
            console.error('Error creating task:', error);
            this.isLoading = false;
            this.showErrorModal = true;
            this.errorModalConfig = {
              type: 'error',
              message: 'Failed to create task. Please try again.',
              showClose: true
            };
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
          };
          reader.readAsDataURL(file);
        } else {
          this.filePreviews.push({
            file: file,
            preview: ''
          });
        }
      });
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  getFileIcon(fileType: string): string {
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
}

