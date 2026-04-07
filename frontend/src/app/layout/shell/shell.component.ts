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
            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <mat-icon class="text-white text-xl">school</mat-icon>
            </div>
            <div>
              <h1 class="font-bold text-gray-900 text-lg leading-tight">DevAcademy</h1>
              <p class="text-xs text-gray-500">Learn to Code</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-1">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a routerLink="/my-progress" routerLinkActive="active" class="nav-link">
            <mat-icon>trending_up</mat-icon>
            <span>My Progress</span>
          </a>
          @if (isAdmin()) {
            <div class="pt-4 pb-2">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">Admin</p>
            </div>
            <a routerLink="/admin" routerLinkActive="active" class="nav-link">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Admin Dashboard</span>
            </a>
          }
        </nav>

        <div class="p-4 border-t border-gray-100">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <mat-icon class="text-blue-600" style="font-size:20px">person</mat-icon>
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
