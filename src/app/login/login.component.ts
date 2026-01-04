import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ModalComponent, ModalConfig } from '../shared/components/modal/modal.component';

@Component({
  selector: 'login-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showForgot = false;
  currentDate: string = '';
  showSuccessModal = false;
  showErrorModal = false;
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

  constructor(private router: Router) {}

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

  login() {
    if (!this.username || !this.password) {
      this.showErrorModal = true;
      this.errorModalConfig = {
        type: 'error',
        message: 'Please enter both username and password.',
        showClose: true
      };
      return;
    }
    // Dummy method for now
    this.showSuccessModal = true;
    this.successModalConfig = {
      type: 'success',
      message: `Logged in as ${this.username}`,
      showClose: true
    };
    // In a real app, navigate after successful login
    // setTimeout(() => this.router.navigate(['/tasks']), 1500);
  }

  forgotPassword() {
    if (!this.username) {
      this.showErrorModal = true;
      this.errorModalConfig = {
        type: 'error',
        message: 'Please enter your username first.',
        showClose: true
      };
      return;
    }
    // Dummy forgot password
    this.showSuccessModal = true;
    this.successModalConfig = {
      type: 'success',
      message: 'Reset password link sent!',
      showClose: true
    };
  }
}

