import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  rememberMe = false;
  isLoading = false;
  errorMessage = '';

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
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Theme initialization if needed
  }

  onMouseMove(event: MouseEvent, container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    this.mouseX = event.clientX - rect.left;
    this.mouseY = event.clientY - rect.top;
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

  isDarkMode(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.modalConfig = {
        type: 'error',
        title: 'Validation Failed',
        message: 'Username and password are required.',
        showClose: true,
        closeText: 'Understood'
      };
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      username: this.username,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        
        this.modalConfig = {
          type: 'success',
          title: 'Login Successful',
          message: 'Welcome back! Redirecting to your dashboard...',
          showClose: false
        };
        this.isModalOpen = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.isModalOpen = false;
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.isLoading = false;
        
        const msg = error.error?.msg || error.error?.message || 'Invalid username or password.';
        this.errorMessage = msg;

        this.modalConfig = {
          type: 'error',
          title: 'Login Failed',
          message: msg,
          showClose: true,
          closeText: 'Try Again'
        };
        this.isModalOpen = true;
        this.cdr.detectChanges();
      }
    });
  }

  handleModalClose() {
    this.isModalOpen = false;
  }
}

