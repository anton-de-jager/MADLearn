import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ProgressService } from '../../../core/services/progress.service';
import { TestService } from '../../../core/services/test.service';
import { ProgressSummary, TestResult, UserProgress } from '../../../core/models/models';

@Component({
  selector: 'app-my-progress',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatTabsModule],
  template: `
    <div class="page-container">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">My Progress</h1>

      @if (summary) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="stat-card text-center">
            <p class="text-4xl font-black text-violet-600">{{ summary.completedLessons }}</p>
            <p class="text-gray-500 mt-1">Lessons Completed</p>
            <p class="text-xs text-gray-400">of {{ summary.totalLessons }} total</p>
          </div>
          <div class="stat-card text-center">
            <p class="text-4xl font-black text-green-600">{{ summary.progressPercentage }}%</p>
            <p class="text-gray-500 mt-1">Course Progress</p>
            <div class="progress-bar-custom mt-3">
              <div class="fill" [style.width.%]="summary.progressPercentage"></div>
            </div>
          </div>
          <div class="stat-card text-center">
            <p class="text-4xl font-black text-purple-600">{{ formatHours(summary.totalTimeSpentMinutes) }}</p>
            <p class="text-gray-500 mt-1">Hours Studied</p>
          </div>
        </div>
      }

      <mat-tab-group>
        <mat-tab label="Lesson Progress">
          <div class="pt-6 space-y-2">
            @for (prog of progresses; track prog.lessonId) {
              <div class="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
                <div class="flex items-center gap-3">
                  @if (prog.isCompleted) {
                    <mat-icon class="text-green-500">check_circle</mat-icon>
                  } @else {
                    <mat-icon class="text-gray-300">radio_button_unchecked</mat-icon>
                  }
                  <div>
                    <p class="font-medium text-gray-800">{{ prog.lessonTitle }}</p>
                    @if (prog.completedAt) {
                      <p class="text-xs text-gray-500">Completed {{ prog.completedAt | date:'MMM d, y' }}</p>
                    }
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-600">{{ prog.timeSpentMinutes }} min</p>
                  <span [class]="prog.isCompleted ? 'badge badge-success' : 'badge badge-warning'">
                    {{ prog.isCompleted ? 'Done' : 'In Progress' }}
                  </span>
                </div>
              </div>
            }
            @if (progresses.length === 0) {
              <div class="text-center py-12 text-gray-400">
                <mat-icon style="font-size:48px">school</mat-icon>
                <p class="mt-2">Start a lesson to track your progress!</p>
                <a routerLink="/dashboard">
                  <button class="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">Browse Courses</button>
                </a>
              </div>
            }
          </div>
        </mat-tab>

        <mat-tab label="Test Results">
          <div class="pt-6 space-y-3">
            @for (result of testResults; track result.id) {
              <div class="flex items-center justify-between p-4 bg-white rounded-xl border"
                   [class.border-green-200]="result.passed"
                   [class.border-red-200]="!result.passed">
                <div>
                  <p class="font-medium text-gray-800">{{ result.testTitle }}</p>
                  <p class="text-xs text-gray-500">{{ result.takenAt | date:'MMM d, y h:mm a' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-2xl font-bold"
                        [class.text-green-600]="result.passed"
                        [class.text-red-500]="!result.passed">{{ result.score }}%</span>
                  <span [class]="result.passed ? 'badge badge-success' : 'badge badge-danger'">
                    {{ result.passed ? 'PASS' : 'FAIL' }}
                  </span>
                </div>
              </div>
            }
            @if (testResults.length === 0) {
              <div class="text-center py-12 text-gray-400">
                <mat-icon style="font-size:48px">quiz</mat-icon>
                <p class="mt-2">No test results yet. Complete a lesson and take the quiz!</p>
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class MyProgressComponent implements OnInit {
  private progressService = inject(ProgressService);
  private testService = inject(TestService);

  summary: ProgressSummary | null = null;
  progresses: UserProgress[] = [];
  testResults: TestResult[] = [];

  ngOnInit() {
    this.progressService.getSummary().subscribe(s => this.summary = s);
    this.progressService.getMyProgress().subscribe(p => this.progresses = p);
    this.testService.getMyResults().subscribe(r => this.testResults = r);
  }

  formatHours(minutes: number): string {
    return (minutes / 60).toFixed(1) + 'h';
  }
}
