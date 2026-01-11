import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { TaskListComponent } from './tasks/task-list.component';
import { TaskFormComponent } from './tasks/task-form.component';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'tasks', component: TaskListComponent, canActivate: [authGuard] },
  { path: 'tasks/new', component: TaskFormComponent, canActivate: [authGuard] },
  { path: 'tasks/:id', component: TaskFormComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
];
