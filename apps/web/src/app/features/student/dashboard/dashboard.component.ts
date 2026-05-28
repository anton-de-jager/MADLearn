import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { TestService } from '../../../core/services/test.service';
import { AuthService } from '../../../core/services/auth.service';
import { LearningPath, Course, ProgressSummary, TestResult } from '../../../core/models/models';
import { LearningIntelligenceService } from '../../../core/services/learning-intelligence.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, MatChipsModule],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Welcome back, {{ user()?.username }}!</h1>
        <p class="text-gray-500 mt-1">Continue your learning journey</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat-card">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              <mat-icon class="text-violet-600">menu_book</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ summary?.completedLessons || 0 }}</p>
              <p class="text-sm text-gray-500">Lessons Done</p>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <mat-icon class="text-green-600">trending_up</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ summary?.progressPercentage || 0 }}%</p>
              <p class="text-sm text-gray-500">Progress</p>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <mat-icon class="text-purple-600">quiz</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ recentResults.length }}</p>
              <p class="text-sm text-gray-500">Tests Taken</p>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <mat-icon class="text-orange-600">schedule</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-gray-900">{{ formatTime(summary?.totalTimeSpentMinutes || 0) }}</p>
              <p class="text-sm text-gray-500">Time Spent</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Progress -->
      @if (summary) {
        <mat-card class="mb-8 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-800">Overall Progress</h2>
            <span class="text-sm text-gray-500">{{ summary.completedLessons }} / {{ summary.totalLessons }} lessons</span>
          </div>
          <div class="progress-bar-custom">
            <div class="fill" [style.width.%]="summary.progressPercentage"></div>
          </div>
          <div class="flex justify-between mt-2">
            <span class="text-xs text-gray-400">0%</span>
            <span class="text-xs font-semibold text-violet-600">{{ summary.progressPercentage }}%</span>
            <span class="text-xs text-gray-400">100%</span>
          </div>
        </mat-card>
      }

      <mat-card class="mb-8 p-6">
        <div class="mb-5 flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
            <mat-icon class="text-amber-700">apps</mat-icon>
          </span>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Feature Directory</h2>
            <p class="text-sm text-gray-500">Every core MADLearn workflow is one click away.</p>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <a routerLink="/courses" class="rounded-lg border border-gray-200 bg-white p-4 text-gray-700 no-underline transition hover:border-violet-300 hover:shadow-sm">
            <mat-icon class="text-violet-600">school</mat-icon>
            <p class="mt-2 font-bold text-gray-900">Courses</p>
            <p class="mt-1 text-sm leading-5 text-gray-500">Browse modules and lessons.</p>
          </a>
          <a routerLink="/evidence" class="rounded-lg border border-gray-200 bg-white p-4 text-gray-700 no-underline transition hover:border-violet-300 hover:shadow-sm">
            <mat-icon class="text-violet-600">workspace_premium</mat-icon>
            <p class="mt-2 font-bold text-gray-900">Evidence</p>
            <p class="mt-1 text-sm leading-5 text-gray-500">Review proof and certificates.</p>
          </a>
          <a routerLink="/mad-cloud" class="rounded-lg border border-gray-200 bg-white p-4 text-gray-700 no-underline transition hover:border-violet-300 hover:shadow-sm">
            <mat-icon class="text-violet-600">cloud_done</mat-icon>
            <p class="mt-2 font-bold text-gray-900">MADCloud Coach</p>
            <p class="mt-1 text-sm leading-5 text-gray-500">Get routed learning support.</p>
          </a>
          <a routerLink="/billing" class="rounded-lg border border-gray-200 bg-white p-4 text-gray-700 no-underline transition hover:border-violet-300 hover:shadow-sm">
            <mat-icon class="text-violet-600">payments</mat-icon>
            <p class="mt-2 font-bold text-gray-900">Billing</p>
            <p class="mt-1 text-sm leading-5 text-gray-500">Open Payfast.io plans.</p>
          </a>
        </div>
      </mat-card>

      @if (learningPath) {
        <mat-card class="mb-8 overflow-hidden border border-violet-100">
          <div class="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div class="p-6">
              <div class="mb-4 flex items-center gap-3">
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
                  <mat-icon class="text-violet-700">route</mat-icon>
                </span>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Personalized Learning Path</h2>
                  <p class="text-sm text-gray-500">Next actions are calculated from lesson, test, and MADCloud evidence.</p>
                </div>
              </div>
              <div class="grid gap-3">
                @for (item of learningPath.courses.slice(0, 3); track item.courseId) {
                  <div class="rounded-lg border border-gray-200 bg-white p-4">
                    <div class="mb-2 flex items-center justify-between gap-4">
                      <p class="font-semibold text-gray-900">{{ item.courseTitle }}</p>
                      <span class="rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">{{ item.completionPercentage }}%</span>
                    </div>
                    <div class="progress-bar-custom mb-3">
                      <div class="fill" [style.width.%]="item.completionPercentage"></div>
                    </div>
                    <p class="text-sm leading-6 text-gray-600">{{ item.recommendedAction }}</p>
                  </div>
                }
              </div>
            </div>
            <div class="border-t border-violet-100 bg-violet-50/60 p-6 lg:border-l lg:border-t-0">
              <p class="text-sm font-bold uppercase tracking-wide text-violet-700">MADCloud recommendation</p>
              <p class="mt-2 text-lg font-semibold text-gray-950">{{ learningPath.recommendedMadCloudTask }}</p>
              @if (learningPath.weakAreas.length > 0) {
                <div class="mt-5 grid gap-2">
                  @for (area of learningPath.weakAreas; track area) {
                    <span class="rounded bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">{{ area }}</span>
                  }
                </div>
              } @else {
                <p class="mt-5 rounded bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">No weak areas detected yet.</p>
              }
              <a routerLink="/mad-cloud" class="mt-5 inline-flex">
                <button mat-flat-button color="primary">
                  <mat-icon>cloud_sync</mat-icon> Open MADCloud Coach
                </button>
              </a>
            </div>
          </div>
        </mat-card>
      }

      <!-- Courses -->
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-xl font-semibold text-gray-800">Continue Learning</h2>
        <a routerLink="/courses">
          <button mat-stroked-button><mat-icon>school</mat-icon> All Courses</button>
        </a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        @for (course of courses.slice(0, 2); track course.id) {
          <mat-card class="p-6 cursor-pointer hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-bold text-gray-900 mb-1">{{ course.title }}</h3>
                <p class="text-gray-500 text-sm line-clamp-2">{{ course.description }}</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-2 mb-4">
              @for (tech of course.techStack.split(','); track tech) {
                <span class="badge badge-info">{{ tech.trim() }}</span>
              }
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span class="flex items-center gap-1"><mat-icon class="text-base">calendar_today</mat-icon> {{ course.durationDays }} days</span>
              <span class="flex items-center gap-1"><mat-icon class="text-base">schedule</mat-icon> {{ course.hoursPerDay }}h/day</span>
              <span class="flex items-center gap-1"><mat-icon class="text-base">layers</mat-icon> {{ course.moduleCount }} modules</span>
            </div>
            <a [routerLink]="['/courses', course.id, 'modules']">
              <button mat-flat-button color="primary" class="w-full">
                <mat-icon>play_circle</mat-icon> Start Learning
              </button>
            </a>
          </mat-card>
        }
      </div>

      <!-- Recent Test Results -->
      @if (recentResults.length > 0) {
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Recent Test Results</h2>
        <mat-card class="p-6">
          <div class="space-y-3">
            @for (result of recentResults.slice(0, 5); track result.id) {
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p class="font-medium text-gray-800">{{ result.testTitle }}</p>
                  <p class="text-xs text-gray-500">{{ result.takenAt | date:'MMM d, y' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-lg font-bold" [class.text-green-600]="result.passed" [class.text-red-600]="!result.passed">
                    {{ result.score }}%
                  </span>
                  <span [class]="result.passed ? 'badge badge-success' : 'badge badge-danger'">
                    {{ result.passed ? 'PASS' : 'FAIL' }}
                  </span>
                </div>
              </div>
            }
          </div>
        </mat-card>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private testService = inject(TestService);
  private authService = inject(AuthService);
  private learningIntelligence = inject(LearningIntelligenceService);

  user = this.authService.currentUser;
  courses: Course[] = [];
  summary: ProgressSummary | null = null;
  recentResults: TestResult[] = [];
  learningPath: LearningPath | null = null;

  ngOnInit() {
    this.courseService.getCourses().subscribe(c => this.courses = c);
    this.progressService.getSummary().subscribe(s => this.summary = s);
    this.testService.getMyResults().subscribe(r => this.recentResults = r);
    this.learningIntelligence.getPath().subscribe(path => this.learningPath = path);
  }

  formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
