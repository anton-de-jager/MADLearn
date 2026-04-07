import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { CourseService } from '../../../core/services/course.service';
import { ProgressService } from '../../../core/services/progress.service';
import { Course, Module, Lesson, UserProgress } from '../../../core/models/models';

@Component({
  selector: 'app-course-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatExpansionModule, MatChipsModule],
  template: `
    <div class="page-container">
      <div class="flex items-center gap-2 text-gray-500 text-sm mb-6">
        <a routerLink="/dashboard" class="hover:text-blue-600">Dashboard</a>
        <mat-icon class="text-base">chevron_right</mat-icon>
        <span class="text-gray-900 font-medium">{{ course?.title }}</span>
      </div>

      @if (course) {
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ course.title }}</h1>
          <p class="text-gray-500">{{ course.description }}</p>
          <div class="flex gap-4 mt-3 text-sm text-gray-500">
            <span class="flex items-center gap-1"><mat-icon class="text-base">calendar_today</mat-icon>{{ course.durationDays }} days</span>
            <span class="flex items-center gap-1"><mat-icon class="text-base">schedule</mat-icon>{{ course.hoursPerDay }}h/day</span>
          </div>
        </div>
      }

      <div class="space-y-4">
        @for (dayGroup of modulesByDay; track dayGroup.day) {
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {{ dayGroup.day }}
              </div>
              <h2 class="text-lg font-semibold text-gray-800">Day {{ dayGroup.day }}</h2>
            </div>

            @for (module of dayGroup.modules; track module.id) {
              <mat-expansion-panel class="mb-2">
                <mat-expansion-panel-header>
                  <mat-panel-title class="font-semibold">{{ module.title }}</mat-panel-title>
                  <mat-panel-description>{{ module.lessonCount }} lessons</mat-panel-description>
                </mat-expansion-panel-header>

                <p class="text-gray-500 text-sm mb-4">{{ module.description }}</p>

                @if (lessonsByModule[module.id]) {
                  <div class="space-y-2">
                    @for (lesson of lessonsByModule[module.id]; track lesson.id) {
                      <div class="flex items-center justify-between p-3 rounded-lg border"
                           [class.border-green-200]="isCompleted(lesson.id)"
                           [class.bg-green-50]="isCompleted(lesson.id)"
                           [class.border-gray-200]="!isCompleted(lesson.id)">
                        <div class="flex items-center gap-3">
                          @if (isCompleted(lesson.id)) {
                            <mat-icon class="text-green-600">check_circle</mat-icon>
                          } @else {
                            <mat-icon class="text-gray-400">radio_button_unchecked</mat-icon>
                          }
                          <div>
                            <p class="font-medium text-gray-800">{{ lesson.title }}</p>
                            <p class="text-xs text-gray-500">{{ lesson.lessonType }} · {{ lesson.estimatedMinutes }} min</p>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          @if (lesson.hasTest) {
                            <span class="badge badge-warning">Quiz</span>
                          }
                          <a [routerLink]="['/lessons', lesson.id]">
                            <button mat-stroked-button color="primary" class="text-sm">
                              {{ isCompleted(lesson.id) ? 'Review' : 'Start' }}
                            </button>
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <button mat-stroked-button (click)="loadLessons(module.id)">
                    <mat-icon>expand_more</mat-icon> Load Lessons
                  </button>
                }
              </mat-expansion-panel>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CourseViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);

  course: Course | null = null;
  modules: Module[] = [];
  lessonsByModule: Record<number, Lesson[]> = {};
  completedLessons = new Set<number>();

  get modulesByDay() {
    const days = [...new Set(this.modules.map(m => m.dayNumber))].sort((a, b) => a - b);
    return days.map(day => ({
      day,
      modules: this.modules.filter(m => m.dayNumber === day)
    }));
  }

  ngOnInit() {
    const courseId = +this.route.snapshot.params['courseId'];
    this.courseService.getCourse(courseId).subscribe(c => this.course = c);
    this.courseService.getModules(courseId).subscribe(modules => {
      this.modules = modules;
      modules.forEach(m => this.loadLessons(m.id));
    });
    this.progressService.getMyProgress().subscribe(progresses => {
      progresses.filter(p => p.isCompleted).forEach(p => this.completedLessons.add(p.lessonId));
    });
  }

  loadLessons(moduleId: number) {
    if (!this.lessonsByModule[moduleId]) {
      this.courseService.getLessons(moduleId).subscribe(lessons => {
        this.lessonsByModule[moduleId] = lessons;
      });
    }
  }

  isCompleted(lessonId: number): boolean {
    return this.completedLessons.has(lessonId);
  }
}
