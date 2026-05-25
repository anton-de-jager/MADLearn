import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService } from '../../../core/services/admin.service';
import { UserDetail } from '../../../core/models/models';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatTabsModule],
  template: `
    <div class="page-container">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <a routerLink="/admin" class="hover:text-violet-600">Admin Dashboard</a>
        <mat-icon class="text-base">chevron_right</mat-icon>
        <span class="text-gray-900 font-medium">{{ user?.username }}</span>
      </div>

      @if (user) {
        <!-- User Header -->
        <div class="flex items-center gap-6 mb-8">
          <div class="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center">
            <mat-icon class="text-violet-600" style="font-size:40px">account_circle</mat-icon>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-gray-900">{{ user.username }}</h1>
            <p class="text-gray-500">{{ user.email }}</p>
            <div class="flex gap-3 mt-2">
              <span [class]="user.role === 'Admin' ? 'badge badge-warning' : 'badge badge-info'">{{ user.role }}</span>
              <span class="badge badge-success">{{ completedCount }} lessons completed</span>
              <span class="text-xs text-gray-400">Joined {{ user.createdAt | date:'MMMM d, y' }}</span>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-6 mb-8">
          <div class="stat-card text-center">
            <p class="text-3xl font-bold text-violet-600">{{ completedCount }}</p>
            <p class="text-gray-500">Lessons Done</p>
          </div>
          <div class="stat-card text-center">
            <p class="text-3xl font-bold text-purple-600">{{ user.testResults.length }}</p>
            <p class="text-gray-500">Tests Taken</p>
          </div>
          <div class="stat-card text-center">
            <p class="text-3xl font-bold text-green-600">{{ avgScore }}%</p>
            <p class="text-gray-500">Avg Score</p>
          </div>
        </div>

        <mat-tab-group>
          <mat-tab label="Lesson Progress">
            <div class="pt-6 space-y-2">
              @for (prog of user.progresses; track prog.lessonId) {
                <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                  <div class="flex items-center gap-3">
                    <mat-icon [class]="prog.isCompleted ? 'text-green-500' : 'text-gray-300'">
                      {{ prog.isCompleted ? 'check_circle' : 'radio_button_unchecked' }}
                    </mat-icon>
                    <p class="font-medium text-gray-800">{{ prog.lessonTitle }}</p>
                  </div>
                  <div class="flex items-center gap-4">
                    <span class="text-sm text-gray-500">{{ prog.timeSpentMinutes }} min</span>
                    <span [class]="prog.isCompleted ? 'badge badge-success' : 'badge badge-warning'">
                      {{ prog.isCompleted ? 'Complete' : 'In Progress' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab label="Test Results">
            <div class="pt-6 space-y-3">
              @for (result of user.testResults; track result.id) {
                <div class="flex items-center justify-between p-4 bg-white rounded-xl border">
                  <div>
                    <p class="font-medium text-gray-800">{{ result.testTitle }}</p>
                    <p class="text-xs text-gray-500">{{ result.takenAt | date:'MMM d, y h:mm a' }}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xl font-bold" [class.text-green-600]="result.passed" [class.text-red-500]="!result.passed">
                      {{ result.score }}%
                    </span>
                    <span [class]="result.passed ? 'badge badge-success' : 'badge badge-danger'">
                      {{ result.passed ? 'PASS' : 'FAIL' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);

  user: UserDetail | null = null;

  get completedCount() { return this.user?.progresses.filter(p => p.isCompleted).length ?? 0; }
  get avgScore() {
    const results = this.user?.testResults ?? [];
    return results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  }

  ngOnInit() {
    const id = +this.route.snapshot.params['id'];
    this.adminService.getUserDetail(id).subscribe(u => this.user = u);
  }
}
