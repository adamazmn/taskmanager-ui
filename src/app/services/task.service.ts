import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Task } from '../models/task.model';
import { AuthService } from './auth.service';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/task`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get user details and tasks
  getUserTaskDetail(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getUserTaskDetail`, {
      params: new HttpParams().set('username', username)
    });
  }

  // Helper to get a single task by ID
  getTaskById(taskId: string): Observable<any> {
    const username = this.authService.getUsername() || '';
    return this.getUserTaskDetail(username).pipe(
      map(response => {
        if (response.status === '200' && response.data?.tasks) {
          return response.data.tasks.find((t: any) => t.id === taskId);
        }
        return null;
      })
    );
  }

  // Get all tasks (using getUserTaskDetail as primary source for user)
  getTasks(username: string): Observable<any> {
    return this.getUserTaskDetail(username);
  }

  // Create task with multiple files support
  createTask(dto: any, files?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(dto));
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    return this.http.post(`${this.apiUrl}/createTask`, formData);
  }

  // Update task with multiple files support (replaces existing attachments)
  updateTask(dto: any, files?: File[]): Observable<any> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(dto));
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }
    return this.http.put(`${this.apiUrl}/updateTask`, formData);
  }

  // Update user profile
  updateUser(dto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateUser`, dto);
  }

  // Delete task
  deleteTask(taskId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/deleteTask`, {
      params: new HttpParams().set('taskId', taskId)
    });
  }
}
