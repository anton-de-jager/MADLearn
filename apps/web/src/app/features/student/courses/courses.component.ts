import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Course } from '../../../core/models/models';
import { CourseService } from '../../../core/services/course.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-bold uppercase tracking-wide text-violet-600">Learner catalogue</p>
          <h1 class="mt-2 text-3xl font-bold text-gray-900">Courses</h1>
          <p class="mt-1 max-w-2xl text-gray-500">Browse available learning paths, open modules, and continue lessons from one dedicated place.</p>
        </div>
        <a routerLink="/dashboard">
          <button mat-stroked-button>
            <mat-icon>dashboard</mat-icon> Dashboard
          </button>
        </a>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        @for (course of courses; track course.id) {
          <mat-card class="p-6 transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-bold text-gray-900">{{ course.title }}</h2>
                <p class="mt-2 text-sm leading-6 text-gray-500">{{ course.description }}</p>
              </div>
              <span class="rounded-full bg-violet-50 px-3 py-1 text-sm font-bold text-violet-700">{{ course.moduleCount }} modules</span>
            </div>
            <div class="mb-5 flex flex-wrap gap-2">
              @for (tech of course.techStack.split(','); track tech) {
                <span class="badge badge-info">{{ tech.trim() }}</span>
              }
            </div>
            <div class="mb-5 grid grid-cols-2 gap-3 text-sm text-gray-600 md:grid-cols-3">
              <span class="rounded bg-gray-50 px-3 py-2"><mat-icon class="align-middle text-base">calendar_today</mat-icon> {{ course.durationDays }} days</span>
              <span class="rounded bg-gray-50 px-3 py-2"><mat-icon class="align-middle text-base">schedule</mat-icon> {{ course.hoursPerDay }}h/day</span>
              <span class="rounded bg-gray-50 px-3 py-2"><mat-icon class="align-middle text-base">layers</mat-icon> Structured path</span>
            </div>
            <a [routerLink]="['/courses', course.id, 'modules']">
              <button mat-flat-button color="primary" class="w-full">
                <mat-icon>play_circle</mat-icon> Open Course
              </button>
            </a>
          </mat-card>
        }
      </div>

      @if (!courses.length) {
        <mat-card class="p-10 text-center text-gray-500">
          <mat-icon class="text-5xl text-gray-300">school</mat-icon>
          <p class="mt-3 font-medium">No courses are available yet.</p>
        </mat-card>
      }
    </div>
  `
})
export class CoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  courses: Course[] = [];

  ngOnInit() {
    this.courseService.getCourses().subscribe(courses => this.courses = courses);
  }
}
