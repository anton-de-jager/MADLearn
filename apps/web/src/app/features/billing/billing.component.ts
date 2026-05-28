import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PayfastSubscribeComponent } from '../../shared/payfast/payfast-subscribe.component';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule, PayfastSubscribeComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <header class="border-b border-slate-200 bg-white px-6 py-5">
        <div class="mx-auto flex max-w-6xl flex-col justify-between gap-4 md:flex-row md:items-center">
          <div class="flex items-center gap-3">
            <img src="assets/icon.png" alt="MADLearn" class="h-10 w-10 rounded">
            <div>
              <p class="text-sm font-bold uppercase tracking-wide text-violet-600">Account & billing</p>
              <h1 class="text-2xl font-bold text-slate-950">Subscription Plans</h1>
            </div>
          </div>
          <div class="flex gap-3">
            <a routerLink="/home"><button mat-stroked-button>Home</button></a>
            <a routerLink="/dashboard"><button mat-flat-button color="primary">Open App</button></a>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-6 py-10">
        <mat-card class="mb-8 p-6">
          <div class="grid gap-5 md:grid-cols-3">
            <div class="flex items-start gap-3">
              <mat-icon class="text-violet-600">payments</mat-icon>
              <div>
                <p class="font-bold text-slate-900">Payfast.io only</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">All checkout sessions use the Payfast.io onsite flow.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <mat-icon class="text-violet-600">public</mat-icon>
              <div>
                <p class="font-bold text-slate-900">USD default</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">Plans switch to ZAR when South African location headers are detected.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <mat-icon class="text-violet-600">lock</mat-icon>
              <div>
                <p class="font-bold text-slate-900">Secure checkout</p>
                <p class="mt-1 text-sm leading-6 text-slate-500">Card details are handled by Payfast.io, not stored in MADLearn.</p>
              </div>
            </div>
          </div>
        </mat-card>

        <app-payfast-subscribe
          productName="MADLearn"
          headline="Choose a MADLearn plan"
          lead="Select a plan, add the receipt email, and open secure Payfast.io checkout."
        ></app-payfast-subscribe>
      </main>
    </div>
  `
})
export class BillingComponent {}
