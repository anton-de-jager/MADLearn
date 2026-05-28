import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminLearningInsights, TestResult, UserSummary } from '../../../core/models/models';
import { LearningIntelligenceService } from '../../../core/services/learning-intelligence.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatSortModule, MatInputModule, MatFormFieldModule, MatTooltipModule, FormsModule],
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

      <div class="mb-6 flex flex-wrap gap-2">
        <a routerLink="/admin"><button mat-stroked-button><mat-icon>monitoring</mat-icon> Risk Radar</button></a>
        <a routerLink="/admin/learners"><button mat-stroked-button><mat-icon>groups</mat-icon> Learners</button></a>
        <a routerLink="/admin/test-results"><button mat-stroked-button><mat-icon>fact_check</mat-icon> Test Results</button></a>
        <a routerLink="/admin/skills-interventions"><button mat-stroked-button><mat-icon>grid_view</mat-icon> Skills & Interventions</button></a>
        <a routerLink="/ai"><button mat-flat-button color="primary"><mat-icon>cloud_sync</mat-icon> MADCloud Operator</button></a>
      </div>

      <mat-tab-group [selectedIndex]="selectedTabIndex">
        <mat-tab label="Command Centre">
          <div class="grid gap-6 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
            <mat-card class="p-6">
              <div class="mb-4 flex items-center gap-3">
                <mat-icon class="text-violet-600">monitoring</mat-icon>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Cohort Risk Radar</h2>
                  <p class="text-sm text-gray-500">Learners who need a manager nudge, remediation, or MADCloud revision plan.</p>
                </div>
              </div>
              <div class="space-y-3">
                @for (learner of insights?.atRiskLearners || []; track learner.userId) {
                  <div class="rounded-lg border border-red-100 bg-red-50/60 p-4">
                    <div class="flex items-center justify-between gap-4">
                      <div>
                        <p class="font-bold text-gray-900">{{ learner.name }}</p>
                        <p class="text-xs text-gray-500">{{ learner.email }}</p>
                      </div>
                      <span class="rounded-full bg-white px-3 py-1 text-sm font-bold text-red-600">{{ learner.averageScore }}%</span>
                    </div>
                    <p class="mt-3 text-sm leading-6 text-gray-700">{{ learner.recommendedAction }}</p>
                  </div>
                }
                @if (!insights?.atRiskLearners?.length) {
                  <div class="rounded-lg border border-green-100 bg-green-50 p-4 text-sm font-medium text-green-700">No at-risk learners detected from current evidence.</div>
                }
              </div>
            </mat-card>

            <mat-card class="p-6">
              <div class="mb-4 flex items-center gap-3">
                <mat-icon class="text-amber-600">hub</mat-icon>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">MADProspects Events</h2>
                  <p class="text-sm text-gray-500">Canonical signals ready for universe integrations.</p>
                </div>
              </div>
              <div class="grid gap-3">
                @for (intervention of insights?.interventionQueue || []; track intervention.userId + intervention.trigger) {
                  <div class="rounded-lg border border-gray-200 bg-white p-4">
                    <p class="font-bold text-gray-900">{{ intervention.trigger }}</p>
                    <p class="mt-1 text-sm text-gray-600">{{ intervention.learnerName }} - {{ intervention.action }}</p>
                  </div>
                }
                <div class="rounded-lg border border-violet-100 bg-violet-50 p-4">
                  <p class="font-bold text-violet-900">Supported events</p>
                  <p class="mt-1 text-sm text-violet-800">UserRegistered, CourseAssigned, LessonCompleted, TestSubmitted, CertificateIssued, LearnerAtRisk, MadCloudTaskCompleted.</p>
                </div>
              </div>
            </mat-card>

            <mat-card class="p-6 lg:col-span-2">
              <div class="mb-4 flex items-center gap-3">
                <mat-icon class="text-green-600">grid_view</mat-icon>
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Skills Matrix</h2>
                  <p class="text-sm text-gray-500">Course skills mapped to completion and assessment performance.</p>
                </div>
              </div>
              <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                @for (skill of insights?.skillsMatrix || []; track skill.skill + skill.courseTitle) {
                  <div class="rounded-lg border border-gray-200 bg-white p-4">
                    <p class="font-bold text-gray-900">{{ skill.skill }}</p>
                    <p class="text-xs text-gray-500">{{ skill.courseTitle }}</p>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <span class="rounded bg-gray-50 px-2 py-1">Score {{ skill.averageScore }}%</span>
                      <span class="rounded bg-gray-50 px-2 py-1">Complete {{ skill.completionRate }}%</span>
                    </div>
                  </div>
                }
              </div>
            </mat-card>
          </div>
        </mat-tab>

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
  private learningIntelligence = inject(LearningIntelligenceService);
  private route = inject(ActivatedRoute);

  users: UserSummary[] = [];
  testResults: TestResult[] = [];
  insights: AdminLearningInsights | null = null;
  searchQuery = '';
  selectedTabIndex = 0;

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
    this.selectedTabIndex = Number(this.route.snapshot.data['tabIndex'] ?? 0);
    this.adminService.getUsers().subscribe(u => this.users = u);
    this.adminService.getTestResults().subscribe(r => this.testResults = r);
    this.learningIntelligence.getAdminInsights().subscribe(i => this.insights = i);
  }
}
