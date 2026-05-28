import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MadCloudTask } from '../../core/models/models';
import { MadCloudService } from '../../core/services/mad-cloud.service';

@Component({
  selector: 'app-mad-cloud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900">MADCloud Learning Studio</h1>
          <p class="mt-1 text-slate-500">Tutor support, remediation, practice generation, evidence summaries, and admin copilots are routed only through MADCloud.</p>
        </div>
        <mat-icon class="text-4xl text-violet-600">cloud_done</mat-icon>
      </div>

      <div class="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (template of templates; track template.intent) {
          <button type="button" class="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md" (click)="useTemplate(template)">
            <mat-icon class="text-violet-600">{{ template.icon }}</mat-icon>
            <p class="mt-3 font-bold text-slate-950">{{ template.title }}</p>
            <p class="mt-1 text-sm leading-6 text-slate-500">{{ template.description }}</p>
          </button>
        }
      </div>

      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <mat-card class="p-6">
          <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4">
            <mat-form-field appearance="outline">
              <mat-label>MADCloud task type</mat-label>
              <input matInput formControlName="intent">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Learning context or instruction</mat-label>
              <textarea matInput rows="8" formControlName="input"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="loading || form.invalid">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <ng-container><mat-icon>send</mat-icon> Submit to MADCloud</ng-container>
              }
            </button>
          </form>
        </mat-card>

        <mat-card class="p-6">
          <div class="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-slate-900">Task History</h2>
              <p class="text-sm text-slate-500">Recent learner and admin intelligence jobs.</p>
            </div>
            <button mat-stroked-button type="button" (click)="loadTasks()">
              <mat-icon>refresh</mat-icon> Refresh
            </button>
          </div>
          <div class="grid max-h-[520px] gap-3 overflow-auto pr-1">
            @for (item of tasks; track item.id) {
              <article class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <p class="font-bold text-slate-900">#{{ item.id }} {{ item.taskType }}</p>
                  <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700">{{ item.status }}</span>
                </div>
                <p class="mt-2 line-clamp-2 text-sm text-slate-500">{{ item.input }}</p>
                @if (item.output) {
                  <pre class="mt-3 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-3 text-sm leading-6 text-white">{{ item.output }}</pre>
                }
              </article>
            }
            @if (tasks.length === 0) {
              <div class="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500">No MADCloud tasks yet.</div>
            }
          </div>
        </mat-card>
      </div>

      @if (task) {
        <mat-card class="mt-6 p-6">
          <div class="mb-3 flex items-center gap-2">
            <mat-icon class="text-violet-600">task_alt</mat-icon>
            <h2 class="text-xl font-semibold text-slate-900">Task #{{ task.id }}: {{ task.status }}</h2>
          </div>
          <p class="text-sm text-slate-500">{{ task.completedAt | date:'medium' }}</p>
          <pre class="mt-4 overflow-auto rounded bg-slate-900 p-4 text-sm text-white">{{ task.output }}</pre>
        </mat-card>
      }

      @if (error) {
        <div class="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
      }
    </div>
  `
})
export class MadCloudComponent {
  private fb = inject(FormBuilder);
  private madCloud = inject(MadCloudService);

  form = this.fb.group({
    intent: ['Tutor', Validators.required],
    input: ['Explain the next lesson in plain language, then give me a short practice activity and a confidence check.', Validators.required]
  });
  loading = false;
  error = '';
  task: MadCloudTask | null = null;
  tasks: MadCloudTask[] = [];
  templates = [
    { intent: 'Tutor', icon: 'school', title: 'Learner Tutor', description: 'Explain a difficult topic and add a short check for understanding.', prompt: 'Explain this concept to a learner, give one example, then ask three confidence-check questions.' },
    { intent: 'PracticeQuestions', icon: 'quiz', title: 'Practice Questions', description: 'Generate structured practice from a lesson or weak skill.', prompt: 'Create five practice questions with answer explanations from this lesson evidence.' },
    { intent: 'Remediation', icon: 'psychology', title: 'Remediation Plan', description: 'Turn failed assessments into focused revision actions.', prompt: 'Build a remediation plan for a learner who failed this assessment. Include order, time estimate, and retake readiness.' },
    { intent: 'EvidencePack', icon: 'workspace_premium', title: 'Evidence Summary', description: 'Summarize achievements for certificates, managers, or recruiting.', prompt: 'Summarize this learner evidence into a certificate-ready proof narrative.' },
  ];

  constructor() {
    this.loadTasks();
  }

  useTemplate(template: { intent: string; prompt: string }) {
    this.form.patchValue({ intent: template.intent, input: template.prompt });
  }

  loadTasks() {
    this.madCloud.getMyTasks().subscribe({
      next: tasks => this.tasks = tasks,
      error: () => this.tasks = []
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.madCloud.submitAssist({
      prompt: this.form.value.input || '',
      intent: this.form.value.intent || 'Tutor'
    }).subscribe({
      next: task => {
        this.task = task;
        this.tasks = [task, ...this.tasks.filter(item => item.id !== task.id)];
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'MAD Cloud task failed.';
        this.loading = false;
      }
    });
  }
}
