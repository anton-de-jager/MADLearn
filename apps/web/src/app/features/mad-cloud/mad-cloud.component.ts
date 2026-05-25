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
          <h1 class="text-3xl font-bold text-slate-900">MAD Cloud</h1>
          <p class="mt-1 text-slate-500">Submit a validation task and verify local worker completion.</p>
        </div>
        <mat-icon class="text-4xl text-violet-600">cloud_done</mat-icon>
      </div>

      <mat-card class="p-6">
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Task input</mat-label>
            <textarea matInput rows="4" formControlName="input"></textarea>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="loading || form.invalid">
            @if (loading) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <ng-container><mat-icon>send</mat-icon> Submit task</ng-container>
            }
          </button>
        </form>
      </mat-card>

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
    input: ['MADLearn validation smoke task', Validators.required]
  });
  loading = false;
  error = '';
  task: MadCloudTask | null = null;

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.madCloud.submitTask({ input: this.form.value.input || '', taskType: 'Validation' }).subscribe({
      next: task => {
        this.task = task;
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'MAD Cloud task failed.';
        this.loading = false;
      }
    });
  }
}
