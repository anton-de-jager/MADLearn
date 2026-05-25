import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <main class="min-h-screen bg-white text-slate-900">
      <section class="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <nav class="mb-10 flex items-center justify-between">
          <img src="assets/logo-wide.png" alt="MADLearn" class="h-12 w-auto">
          <div class="flex items-center gap-3">
            <a routerLink="/login" mat-stroked-button>Sign in</a>
            <button mat-flat-button color="primary" (click)="openApp()">
              <mat-icon>school</mat-icon>
              Open app
            </button>
          </div>
        </nav>

        <div class="grid items-center gap-10 md:grid-cols-[1fr_0.8fr]">
          <div>
            <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-600">MAD Prospects LMS</p>
            <h1 class="max-w-3xl text-5xl font-bold leading-tight text-slate-950 md:text-6xl">MADLearn</h1>
            <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              AI-powered learning management for South African teams, with structured courses, progress tracking, assessments, and MAD Cloud task validation.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <button mat-flat-button color="primary" (click)="openApp()">
                <mat-icon>login</mat-icon>
                Continue learning
              </button>
              <a routerLink="/register" mat-stroked-button>
                <mat-icon>person_add</mat-icon>
                Create account
              </a>
            </div>
          </div>

          <div class="rounded-lg border border-violet-100 bg-violet-50 p-6">
            <img src="assets/logo.png" alt="MADLearn logo" class="mx-auto mb-6 h-28 w-auto">
            <div class="grid gap-3 text-sm text-slate-700">
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-violet-600">verified</mat-icon> Branded course delivery</div>
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-amber-600">query_stats</mat-icon> Learner progress evidence</div>
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-violet-600">cloud_done</mat-icon> MAD Cloud task execution</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `
})
export class HomeComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  openApp() {
    this.router.navigate([this.auth.isLoggedIn() ? '/dashboard' : '/login']);
  }
}
