import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-gray-50">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <img src="assets/icon.png" alt="MADLearn" class="h-10 w-10 rounded">
            <div>
              <h1 class="font-bold text-gray-900 text-lg leading-tight">MADLearn</h1>
              <p class="text-xs text-gray-500">Business learning</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 overflow-auto p-4">
          <p class="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Learner</p>
          <div class="space-y-1">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/courses" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
            <mat-icon>school</mat-icon>
            <span>Courses</span>
          </a>
          <a routerLink="/my-progress" routerLinkActive="active" class="nav-link">
            <mat-icon>trending_up</mat-icon>
            <span>My Progress</span>
          </a>
          <a routerLink="/evidence" routerLinkActive="active" class="nav-link">
            <mat-icon>workspace_premium</mat-icon>
            <span>Evidence & Certificates</span>
          </a>
          <a routerLink="/mad-cloud" routerLinkActive="active" class="nav-link">
            <mat-icon>cloud_done</mat-icon>
            <span>MADCloud Coach</span>
          </a>
          </div>

          @if (isAdmin()) {
            <div class="pt-5 pb-2">
              <p class="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Admin</p>
            </div>
            <div class="space-y-1">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Admin Dashboard</span>
            </a>
            <a routerLink="/admin/learners" routerLinkActive="active" class="nav-link">
              <mat-icon>groups</mat-icon>
              <span>Learners</span>
            </a>
            <a routerLink="/admin/test-results" routerLinkActive="active" class="nav-link">
              <mat-icon>fact_check</mat-icon>
              <span>Test Results</span>
            </a>
            <a routerLink="/admin/skills-interventions" routerLinkActive="active" class="nav-link">
              <mat-icon>monitoring</mat-icon>
              <span>Skills & Interventions</span>
            </a>
            <a routerLink="/ai" routerLinkActive="active" class="nav-link">
              <mat-icon>cloud_sync</mat-icon>
              <span>MADCloud Operator</span>
            </a>
            </div>
          }

          <div class="pt-5 pb-2">
            <p class="px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Account & Billing</p>
          </div>
          <div class="space-y-1">
            <a routerLink="/billing" routerLinkActive="active" class="nav-link">
              <mat-icon>payments</mat-icon>
              <span>Subscription Plans</span>
            </a>
          </div>
        </nav>

        <div class="p-4 border-t border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center">
              <mat-icon class="text-violet-600" style="font-size:20px">person</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ user()?.username }}</p>
              <p class="text-xs text-gray-500 truncate">{{ user()?.role }}</p>
            </div>
          </div>
          <button mat-stroked-button class="w-full" (click)="logout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `
})
export class ShellComponent {
  private authService = inject(AuthService);
  user = this.authService.currentUser;
  isAdmin = computed(() => this.authService.isAdmin());

  logout() {
    this.authService.logout();
  }
}
