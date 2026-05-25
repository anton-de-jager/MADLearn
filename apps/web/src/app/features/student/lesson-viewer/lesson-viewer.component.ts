import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { LessonDetail } from '../../../core/models/models';

@Component({
  selector: 'app-lesson-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      @if (loading) {
        <div class="flex items-center justify-center h-64">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (lesson) {
        <!-- Header -->
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <a routerLink="/dashboard" class="hover:text-violet-600">Dashboard</a>
          <mat-icon class="text-base">chevron_right</mat-icon>
          <span class="text-gray-900 font-medium">{{ lesson.title }}</span>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <!-- Main Content -->
          <div class="xl:col-span-3">
            <mat-card class="p-8">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <span class="badge badge-info mb-2">{{ lesson.lessonType }}</span>
                  <h1 class="text-2xl font-bold text-gray-900">{{ lesson.title }}</h1>
                  <p class="text-sm text-gray-500 mt-1">
                    <mat-icon class="text-base">schedule</mat-icon> ~{{ lesson.estimatedMinutes }} minutes
                  </p>
                </div>
                @if (completed) {
                  <span class="badge badge-success text-base px-4 py-2">
                    <mat-icon class="text-base mr-1">check_circle</mat-icon> Completed
                  </span>
                }
              </div>

              <mat-tab-group>
                <mat-tab label="Content">
                  <div class="lesson-content pt-6" [innerHTML]="renderedContent"></div>
                </mat-tab>
                @if (lesson.codeExample) {
                  <mat-tab label="Code Example">
                    <div class="pt-6">
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="font-semibold text-gray-700">Practice Code</h3>
                        <button mat-stroked-button (click)="copyCode()">
                          <mat-icon>content_copy</mat-icon> Copy
                        </button>
                      </div>
                      <pre class="code-block">{{ lesson.codeExample }}</pre>
                    </div>
                  </mat-tab>
                }
              </mat-tab-group>
            </mat-card>
          </div>

          <!-- Sidebar -->
          <div class="xl:col-span-1 space-y-4">
            <mat-card class="p-5">
              <h3 class="font-semibold text-gray-800 mb-3">Lesson Actions</h3>
              <div class="space-y-3">
                @if (!completed) {
                  <button mat-flat-button color="primary" class="w-full" (click)="markComplete()">
                    <mat-icon>check</mat-icon> Mark Complete
                  </button>
                }
                @if (lesson.test) {
                  <a [routerLink]="['/tests', lesson.id]">
                    <button mat-stroked-button class="w-full" color="accent">
                      <mat-icon>quiz</mat-icon> Take Quiz
                    </button>
                  </a>
                }
              </div>
            </mat-card>

            <mat-card class="p-5">
              <h3 class="font-semibold text-gray-800 mb-3">Time Tracker</h3>
              <div class="text-center">
                <p class="text-3xl font-bold text-violet-600">{{ formatTime(elapsedSeconds) }}</p>
                <p class="text-xs text-gray-500 mt-1">Time on this lesson</p>
              </div>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `
})
export class LessonViewerComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private sanitizer = inject(DomSanitizer);

  lesson: LessonDetail | null = null;
  loading = true;
  completed = false;
  renderedContent: SafeHtml = '';
  elapsedSeconds = 0;
  private timer: any;
  private startTime = Date.now();

  ngOnInit() {
    const id = +this.route.snapshot.params['id'];
    this.courseService.getLesson(id).subscribe(lesson => {
      this.lesson = lesson;
      this.loading = false;
      this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(
        this.renderMarkdown(lesson.content)
      );
    });

    this.progressService.getMyProgress().subscribe(progresses => {
      const id = +this.route.snapshot.params['id'];
      this.completed = progresses.some(p => p.lessonId === id && p.isCompleted);
    });

    this.timer = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    }, 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
    if (this.lesson) {
      const minutes = Math.floor(this.elapsedSeconds / 60);
      if (minutes > 0) {
        this.progressService.updateTime(this.lesson.id, minutes).subscribe();
      }
    }
  }

  markComplete() {
    if (!this.lesson) return;
    const minutes = Math.max(1, Math.floor(this.elapsedSeconds / 60));
    this.progressService.completeLesson(this.lesson.id, minutes).subscribe(() => {
      this.completed = true;
    });
  }

  copyCode() {
    if (this.lesson?.codeExample) {
      navigator.clipboard.writeText(this.lesson.codeExample);
    }
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private renderMarkdown(md: string): string {
    return md
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[huplb])/gm, '')
      .replace(/<\/p><p>/g, '</p>\n<p>');
  }
}
