import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';
import { finalize, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  name = '';
  username = '';
  password = '';
  email = '';
  activationLinkSent = false;
  currentDate: string = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  // Mouse tracking for space background effect
  mouseX = 0;
  mouseY = 0;

  // Modal properties
  isModalOpen = false;
  modalConfig: ModalConfig = {
    type: 'success',
    title: '',
    message: '',
    showClose: true,
    closeText: 'Close'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
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

  toggleTheme() {
    const htmlElement = document.documentElement;
    if (htmlElement.classList.contains('dark')) {
      htmlElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      htmlElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }

  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
  }

  signUp() {
    // Client-side validation
    if (!this.name.trim() || !this.username.trim() || !this.email.trim() || !this.password.trim()) {
      this.modalConfig = {
        type: 'error',
        title: 'Validation Failed',
        message: 'All fields are required. Please fill in all the details.',
        showClose: true,
        closeText: 'Understood'
      };
      this.isModalOpen = true;
      return;
    }

    // Password minimum length validation
    if (this.password.length < 8) {
      this.modalConfig = {
        type: 'error',
        title: 'Validation Failed',
        message: 'Password must be at least 8 characters long.',
        showClose: true,
        closeText: 'Understood'
      };
      this.isModalOpen = true;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    console.log('Sending registration request for:', this.username);

    const userData = {
      name: this.name,
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.authService.registerUser(userData).subscribe({
      next: (response) => {
        console.log('Registration SUCCESS:', response);
        this.isLoading = false;
        
        this.modalConfig = {
          type: 'success',
          title: 'Registration Successful',
          message: 'Your account has been created successfully.',
          showClose: true,
          closeText: 'Go to Login'
        };
        
        this.isModalOpen = true;
        this.cdr.detectChanges(); // Force UI update

        setTimeout(() => {
          if (this.isModalOpen && this.modalConfig.type === 'success') {
            this.handleModalClose();
          }
        }, 4000);
      },
      error: (error) => {
        console.error('Registration ERROR:', error);
        this.isLoading = false;
        
        // Extract error message
        let msg = 'Registration failed. Please try again.';
        if (error.error) {
            msg = error.error.msg || error.error.message || (typeof error.error === 'string' ? error.error : msg);
        } else if (error.message) {
            msg = error.message;
        }
        
        this.errorMessage = msg;
        this.modalConfig = {
          type: 'error',
          title: 'Registration Failed',
          message: msg,
          showClose: true,
          closeText: 'Back'
        };

        this.isModalOpen = true;
        this.cdr.detectChanges(); // Force UI update
      }
    });


  }

  handleModalClose() {
    this.isModalOpen = false;
    if (this.modalConfig.type === 'success') {
      this.router.navigate(['/login']);
    }
  }
}
