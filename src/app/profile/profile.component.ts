import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { TaskService } from '../services/task.service';
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';

// Define the interface here or import it if shared
interface UserProfile {
  name: string;
  email: string;
  username: string;
  profilePhoto: string;
  password?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ModalComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  
  // Initialize with default values to avoid null checks in template
  user: UserProfile = {
    name: '',
    email: '',
    username: '',
    profilePhoto: '',
    password: ''
  };
  
  tasksCount = 0;
  isSubmitting = false;

  // Modal properties
  isModalOpen = false;
  modalConfig: ModalConfig = {
    type: 'success',
    message: '',
    showClose: true
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const username = this.authService.getUsername();
    if (username) {
      this.loadUserProfile(username);
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadUserProfile(username: string): void {
    this.taskService.getUserTaskDetail(username).subscribe({
      next: (res) => {
        if (res.status === '200' && res.data) {
          const data = res.data;
          this.user = {
            ...this.user,
            username: data.username,
            name: data.name || '',
            email: data.email || '',
            profilePhoto: data.profilePhoto || ''
          };
          this.tasksCount = data.tasks ? data.tasks.length : 0;
          this.cdr.detectChanges(); // Force update
        }
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  handleFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.user.profilePhoto = e.target.result as string;
          this.cdr.detectChanges(); // Immediately update view
        }
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile(): void {
    this.isSubmitting = true;
    
    // Create DTO
    const updateDto = {
      username: this.user.username,
      name: this.user.name,
      email: this.user.email,
      profilePhoto: this.user.profilePhoto, // Ensure this is sending the base64 string
      password: this.user.password || null
    };

    console.log('Sending update:', updateDto);

    this.taskService.updateUser(updateDto).subscribe({
      next: (res) => {
        console.log('Update response:', res);
        this.isSubmitting = false;
        
        // Check for success status (handle both string "200" and number 200)
        if (res && (res.status === '200' || res.status === 200)) {
           this.showModalMessage('success', 'Profile updated successfully!');
           this.user.password = ''; // Clear password field
        } else {
           this.showModalMessage('error', res?.message || 'Failed to update profile.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Update error:', err);
        this.isSubmitting = false;
        const msg = err.error?.message || 'An error occurred while updating profile.';
        this.showModalMessage('error', msg);
        this.cdr.detectChanges();
      }
    });
  }

  showModalMessage(type: 'success' | 'error' | 'warning', message: string): void {
    this.modalConfig = {
      type,
      message,
      showClose: true,
      title: type === 'success' ? 'Success' : 'Error'
    };
    this.isModalOpen = true;
  }
  
  handleModalClose(): void {
    this.isModalOpen = false;
  }

  toggleTheme() {
    document.documentElement.classList.toggle('dark');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
