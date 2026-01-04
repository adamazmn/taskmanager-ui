import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/tasks'; // Update with your API URL

  constructor(private http: HttpClient) {}

  // Get all tasks
  getTasks(): Observable<Task[]> {
    // For now, return mock data. Replace with actual API call
    return of(this.getMockTasks());
    // return this.http.get<Task[]>(this.apiUrl);
  }

  // Get task by ID
  getTaskById(id: string): Observable<Task> {
    // For now, return mock data. Replace with actual API call
    const tasks = this.getMockTasks();
    const task = tasks.find(t => t.id === id) || tasks[0];
    return of(task);
    // return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  // Create task
  createTask(task: Partial<Task>): Observable<Task> {
    // For now, return mock data. Replace with actual API call
    const newTask: Task = {
      id: Date.now().toString(),
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      dueDate: task.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: task.attachments || []
    };
    return of(newTask);
    // return this.http.post<Task>(this.apiUrl, task);
  }

  // Update task
  updateTask(id: string, task: Partial<Task>): Observable<Task> {
    // For now, return mock data. Replace with actual API call
    const updatedTask: Task = {
      id,
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      dueDate: task.dueDate || null,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: task.attachments || []
    };
    return of(updatedTask);
    // return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  // Delete task
  deleteTask(id: string): Observable<void> {
    // For now, return mock data. Replace with actual API call
    return of(undefined);
    // return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Mock data for development
  private getMockTasks(): Task[] {
    return [
      {
        id: '1',
        title: 'Complete project proposal',
        description: 'Write and submit the project proposal for Q1 2026',
        status: 'pending',
        dueDate: '2026-01-15',
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-01T10:00:00Z'
      },
      {
        id: '2',
        title: 'Review team feedback',
        description: 'Go through all team feedback and prepare response',
        status: 'done',
        dueDate: '2026-01-05',
        createdAt: '2026-01-02T14:30:00Z',
        updatedAt: '2026-01-03T09:15:00Z'
      },
      {
        id: '3',
        title: 'Schedule team meeting',
        description: 'Organize weekly team sync meeting',
        status: 'pending',
        dueDate: null,
        createdAt: '2026-01-03T08:00:00Z',
        updatedAt: '2026-01-03T08:00:00Z'
      }
    ];
  }
}

