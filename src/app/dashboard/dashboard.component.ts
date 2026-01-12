import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  batteryLevel: number = 0;
  isCharging: boolean = false;
  pendingTasksCount = 0;
  completedTodayCount = 0;
  recentTasks: any[] = [];
  upcomingTasks: any[] = [];
  weeklyActivity: { day: string, count: number, height: string }[] = [];
  isLoading = false;
  userName = 'User';

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const username = this.authService.getUsername();
    if (username) {
        this.loadDashboardData(username);
    }
    this.getBatteryStatus();
  }

  getBatteryStatus(): void {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.updateBatteryUI(battery);
        
        battery.addEventListener('chargingchange', () => {
          this.updateBatteryUI(battery);
        });
        
        battery.addEventListener('levelchange', () => {
          this.updateBatteryUI(battery);
        });
      });
    } else {
      console.warn('Battery Status API not supported on this browser.');
      this.batteryLevel = 100; // Default/Fallback
    }
  }

  updateBatteryUI(battery: any): void {
    this.batteryLevel = Math.round(battery.level * 100);
    this.isCharging = battery.charging;
    this.cdr.detectChanges();
  }
  
  loadDashboardData(username: string): void {
    this.isLoading = true;
    this.taskService.getUserTaskDetail(username).subscribe({
      next: (response) => {
        if (response.status === '200' && response.data) {
          const rawTasks = response.data.tasks || [];
          this.userName = response.data.name || 'User';

          // Normalize tasks
          const tasks = rawTasks.map((t: any) => ({
            ...t,
            status: t.status ? t.status.toLowerCase() : 'pending',
            updatedDate: t.updatedDate ? new Date(t.updatedDate) : null,
            createdDate: t.createdDate ? new Date(t.createdDate) : null
          }));
          
          this.pendingTasksCount = tasks.filter((t: any) => t.status === 'pending').length;
          
          // Count completed today
          const now = new Date();
          const todayString = now.toDateString();
          this.completedTodayCount = tasks.filter((t: any) => {
              return t.status === 'done' && 
                     t.updatedDate && 
                     t.updatedDate.toDateString() === todayString;
          }).length;
          
          // Get 3 most recent tasks
          this.recentTasks = tasks.slice(0, 3);
          
          // Get upcoming tasks (Pending tasks with future due dates)
          this.upcomingTasks = tasks
            .filter((t: any) => t.status === 'pending' && t.dueDate && new Date(t.dueDate) >= now)
            .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 2);

          // Calculate Activity Trends (Last 7 days completion)
          this.calculateWeeklyActivity(tasks);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateWeeklyActivity(tasks: any[]): void {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const activityMap = new Map<string, number>();

    // Initialize map for last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = days[d.getDay()];
      // Key by date string to be accurate, but display day name
      activityMap.set(d.toDateString(), 0);
    }

    // Fill counts
    tasks.forEach(t => {
      if (t.status === 'done' && t.updatedDate) {
        const dStr = t.updatedDate.toDateString();
        if (activityMap.has(dStr)) {
          activityMap.set(dStr, activityMap.get(dStr)! + 1);
        }
      }
    });

    // Convert to array for view
    let maxCount = 0;
    this.weeklyActivity = [];
    
    // Iterate over the last 7 days order
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = d.toDateString();
      const count = activityMap.get(dStr) || 0;
      if (count > maxCount) maxCount = count;
      
      this.weeklyActivity.push({
        day: days[d.getDay()],
        count: count,
        height: '0%' // Will calculate next
      });
    }

    // Normalize heights
    this.weeklyActivity = this.weeklyActivity.map(item => ({
      ...item,
      height: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '5%' // Min 5% for visuals
    }));
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleTheme() {
    document.documentElement.classList.toggle('dark');
  }
}
