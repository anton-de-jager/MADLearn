import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-billing-result',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="min-h-screen bg-slate-50 p-6">
      <div class="mx-auto flex min-h-[72vh] max-w-3xl items-center">
        <mat-card class="w-full p-8">
          <div class="flex items-start gap-4">
            <span class="flex h-14 w-14 items-center justify-center rounded-xl" [class.bg-green-100]="success" [class.bg-amber-100]="!success">
              <mat-icon [class.text-green-700]="success" [class.text-amber-700]="!success">{{ success ? 'verified' : 'pending_actions' }}</mat-icon>
            </span>
            <div>
              <h1 class="text-3xl font-bold text-slate-950">{{ success ? 'Payfast checkout received' : 'Payfast checkout paused' }}</h1>
              <p class="mt-3 text-slate-600">
                {{ success
                  ? 'MADLearn is waiting for the secure Payfast.io notification before activating billing entitlements.'
                  : 'No subscription changes were made. You can return to MADLearn and start Payfast.io checkout again when ready.' }}
              </p>
              <div class="mt-6 flex flex-wrap gap-3">
                <a routerLink="/dashboard"><button mat-flat-button color="primary">Return to Dashboard</button></a>
                <a routerLink="/home"><button mat-stroked-button>View Plans</button></a>
              </div>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `
})
export class BillingResultComponent {
  private router = inject(Router);
  success = this.router.url.includes('success');
}
