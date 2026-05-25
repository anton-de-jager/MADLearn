import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { TestResult, UserSummary } from '../../../core/models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatSortModule, MatInputModule, MatFormFieldModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p class="text-gray-500 mt-1">Monitor student performance and progress</p>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="stat-card">
          <p class="text-sm text-gray-500">Total Students</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ students.length }}</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500">Tests Taken</p>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ testResults.length }}</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500">Avg Score</p>
          <p class="text-3xl font-bold text-violet-600 mt-1">{{ avgScore }}%</p>
        </div>
        <div class="stat-card">
          <p class="text-sm text-gray-500">Pass Rate</p>
          <p class="text-3xl font-bold text-green-600 mt-1">{{ passRate }}%</p>
        </div>
      </div>

      <mat-tab-group>
        <!-- Students Tab -->
        <mat-tab label="Students ({{ students.length }})">
          <div class="pt-6">
            <mat-form-field appearance="outline" class="w-full mb-4">
              <mat-label>Search students...</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input matInput [(ngModel)]="searchQuery" placeholder="Search by name or email">
            </mat-form-field>

            <div class="overflow-x-auto">
              <table mat-table [dataSource]="filteredStudents" class="w-full bg-white rounded-xl shadow-sm">
                <ng-container matColumnDef="username">
                  <th mat-header-cell *matHeaderCellDef class="font-semibold">Student</th>
                  <td mat-cell *matCellDef="let s">
                    <div class="flex items-center gap-3 py-2">
                      <div class="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
                        <mat-icon class="text-violet-600" style="font-size:18px">person</mat-icon>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">{{ s.username }}</p>
                        <p class="text-xs text-gray-500">{{ s.email }}</p>
                      </div>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let s">
                    <span [class]="s.role === 'Admin' ? 'badge badge-warning' : 'badge badge-info'">{{ s.role }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="completedLessons">
                  <th mat-header-cell *matHeaderCellDef>Lessons Done</th>
                  <td mat-cell *matCellDef="let s">
                    <span class="font-semibold text-gray-800">{{ s.completedLessons }}</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="totalTests">
                  <th mat-header-cell *matHeaderCellDef>Tests</th>
                  <td mat-cell *matCellDef="let s">{{ s.totalTests }}</td>
                </ng-container>

                <ng-container matColumnDef="averageScore">
                  <th mat-header-cell *matHeaderCellDef>Avg Score</th>
                  <td mat-cell *matCellDef="let s">
                    <span [class]="s.averageScore >= 70 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'">
                      {{ s.averageScore > 0 ? s.averageScore + '%' : 'N/A' }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="createdAt">
                  <th mat-header-cell *matHeaderCellDef>Joined</th>
                  <td mat-cell *matCellDef="let s">{{ s.createdAt | date:'MMM d, y' }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let s">
                    <a [routerLink]="['/admin/users', s.id]">
                      <button mat-icon-button color="primary" matTooltip="View Details">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </a>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="studentColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: studentColumns;" class="hover:bg-gray-50"></tr>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- Test Results Tab -->
        <mat-tab label="Test Results ({{ testResults.length }})">
          <div class="pt-6 space-y-3">
            @for (result of testResults.slice(0, 50); track result.id) {
              <div class="flex items-center justify-between p-4 bg-white rounded-xl border"
                   [class.border-l-4]="true"
                   [class.border-l-green-500]="result.passed"
                   [class.border-l-red-500]="!result.passed">
                <div>
                  <p class="font-medium text-gray-800">{{ result.testTitle }}</p>
                  <p class="text-xs text-gray-500">{{ result.takenAt | date:'MMM d, y h:mm a' }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-xl font-bold"
                        [class.text-green-600]="result.passed"
                        [class.text-red-500]="!result.passed">
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
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  users: UserSummary[] = [];
  testResults: TestResult[] = [];
  searchQuery = '';

  get students() { return this.users.filter(u => u.role !== 'Admin' || true); }
  get filteredStudents() {
    if (!this.searchQuery) return this.students;
    const q = this.searchQuery.toLowerCase();
    return this.students.filter(s =>
      s.username.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }
  get avgScore() {
    const results = this.testResults;
    return results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
  }
  get passRate() {
    return this.testResults.length > 0
      ? Math.round(this.testResults.filter(r => r.passed).length / this.testResults.length * 100) : 0;
  }

  studentColumns = ['username', 'role', 'completedLessons', 'totalTests', 'averageScore', 'createdAt', 'actions'];

  ngOnInit() {
    this.adminService.getUsers().subscribe(u => this.users = u);
    this.adminService.getTestResults().subscribe(r => this.testResults = r);
  }
}
