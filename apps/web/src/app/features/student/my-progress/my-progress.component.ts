import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { ProgressService } from '../../../core/services/progress.service';
import { TestService } from '../../../core/services/test.service';
import { EvidencePack, LearningEvent, ProgressSummary, TestResult, UserProgress } from '../../../core/models/models';
import { LearningIntelligenceService } from '../../../core/services/learning-intelligence.service';

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

      @if (evidencePack) {
        <mat-card class="mb-8 p-6">
          <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-gray-900">Evidence Pack</h2>
              <p class="mt-1 text-sm text-gray-500">A learner-ready proof bundle for certificates, recruiting, and manager reviews.</p>
            </div>
            <span [class]="evidencePack.certificateReady ? 'badge badge-success' : 'badge badge-warning'">
              {{ evidencePack.certificateReady ? 'Certificate Ready' : 'Evidence Building' }}
            </span>
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div class="rounded-lg bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Learner</p>
              <p class="mt-1 font-bold text-gray-900">{{ evidencePack.learnerName }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Lessons</p>
              <p class="mt-1 text-2xl font-black text-violet-600">{{ evidencePack.completedLessons }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Tests</p>
              <p class="mt-1 text-2xl font-black text-green-600">{{ evidencePack.testsTaken }}</p>
            </div>
            <div class="rounded-lg bg-gray-50 p-4">
              <p class="text-sm text-gray-500">Average</p>
              <p class="mt-1 text-2xl font-black text-purple-600">{{ evidencePack.averageScore }}%</p>
            </div>
          </div>
          <p class="mt-4 rounded-lg border border-gray-200 bg-white p-3 text-sm font-medium text-gray-700">{{ evidencePack.certificateStatus }}</p>
        </mat-card>
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

        <mat-tab label="Evidence Timeline">
          <div class="pt-6 space-y-3">
            @for (event of learningEvents; track event.type + event.occurredAt + event.title) {
              <div class="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                <mat-icon class="text-violet-600">{{ iconFor(event.type) }}</mat-icon>
                <div>
                  <p class="font-medium text-gray-800">{{ event.title }}</p>
                  <p class="text-xs text-gray-500">{{ event.type }} · {{ event.occurredAt | date:'MMM d, y h:mm a' }}</p>
                </div>
              </div>
            }
            @if (learningEvents.length === 0) {
              <div class="text-center py-12 text-gray-400">
                <mat-icon style="font-size:48px">timeline</mat-icon>
                <p class="mt-2">Evidence events will appear as learning activity is completed.</p>
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
  private learningIntelligence = inject(LearningIntelligenceService);

  summary: ProgressSummary | null = null;
  progresses: UserProgress[] = [];
  testResults: TestResult[] = [];
  evidencePack: EvidencePack | null = null;
  learningEvents: LearningEvent[] = [];

  ngOnInit() {
    this.progressService.getSummary().subscribe(s => this.summary = s);
    this.progressService.getMyProgress().subscribe(p => this.progresses = p);
    this.testService.getMyResults().subscribe(r => this.testResults = r);
    this.learningIntelligence.getEvidencePack().subscribe(pack => this.evidencePack = pack);
    this.learningIntelligence.getEvents().subscribe(events => this.learningEvents = events);
  }

  formatHours(minutes: number): string {
    return (minutes / 60).toFixed(1) + 'h';
  }

  iconFor(type: string): string {
    if (type.includes('Test')) return 'quiz';
    if (type.includes('MadCloud')) return 'cloud_done';
    if (type.includes('Certificate')) return 'workspace_premium';
    return 'task_alt';
  }
}
