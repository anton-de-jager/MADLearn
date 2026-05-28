import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-amber-50 p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <img src="assets/logo.png" alt="MADLearn" class="h-20 w-auto mx-auto mb-4">
          <h1 class="text-3xl font-bold text-gray-900">MADLearn</h1>
          <p class="text-gray-500 mt-2">MADCloud-powered learning for business teams</p>
        </div>

        <mat-card class="p-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          @if (error) {
            <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-700 text-sm">
              {{ error }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="you@example.com">
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Valid email is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" [type]="showPass ? 'text' : 'password'">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="showPass = !showPass">
                <mat-icon>{{ showPass ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <button mat-flat-button color="primary" class="w-full py-3" type="submit" [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20" class="inline-block"></mat-spinner>
              } @else {
                Sign In
              }
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-500 text-sm">
              Don't have an account?
              <a routerLink="/register" class="text-violet-600 font-semibold hover:underline">Register</a>
            </p>
          </div>

          <div class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <strong>Demo credentials:</strong><br>
            Admin: admin&#64;madprospects.com / P&#64;szw0rdMP<br>
            Student: student&#64;madlearn.local / Student&#64;123
          </div>
        </mat-card>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';
  showPass = false;

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
        this.loading = false;
      }
    });
  }
}
