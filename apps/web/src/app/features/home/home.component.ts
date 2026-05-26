import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

const MAD_UNIVERSE_APPS = [
  { name: 'MAD Prospects', url: 'https://madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-madprospects.png' },
  { name: 'MADai', url: 'https://madai.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADai.png' },
  { name: 'MADAuthor', url: 'https://madauthor.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADAuthor.png' },
  { name: 'MAD Cloud', url: 'https://madcloud.madprospects.com/', logo: '' },
  { name: 'MADCreate', url: 'https://madcreate.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADCreate.png' },
  { name: 'MADHub', url: 'https://madhub.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADHub.png' },
  { name: 'MADLeads', url: 'https://madleads.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADLeads.png' },
  { name: 'MADLearn', url: 'https://madlearn.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADLearn.png' },
  { name: 'MADLove', url: 'https://madlove.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADLove.png' },
  { name: 'MADMultisciple', url: 'https://madmultisciple.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADMultisciple.png' },
  { name: 'MADPulse', url: 'https://madpulse.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADPulse.png' },
  { name: 'MADRecruiting', url: 'https://madrecruiting.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADRecruiting.png' },
] as const;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  styles: [`
    .mad-universe-strip {
      position: relative;
      overflow: hidden;
      background: #0d1628;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      padding: 16px 0;
    }
    .mad-universe-inner {
      display: flex;
      align-items: center;
      gap: 24px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
    }
    .mad-universe-kicker {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #7dd3fc;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .mad-universe-kicker span { color: #38bdf8; }
    .mad-universe-marquee {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
      mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    }
    .mad-universe-track {
      display: flex;
      align-items: center;
      gap: 36px;
      width: max-content;
      animation: madUniverseScroll 44s linear infinite;
    }
    .mad-universe-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: max-content;
      opacity: 0.78;
      text-decoration: none;
      transition: opacity 160ms ease, transform 160ms ease;
    }
    .mad-universe-link:hover { opacity: 1; transform: translateY(-1px); }
    .mad-universe-link img {
      display: block;
      width: auto;
      max-width: 168px;
      height: 24px;
      object-fit: contain;
      filter: drop-shadow(0 0 12px rgba(255,255,255,0.08));
    }
    .mad-universe-text {
      color: #cbd5e1;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.1em;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    @keyframes madUniverseScroll {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @media (max-width: 760px) {
      .mad-universe-inner {
        align-items: stretch;
        flex-direction: column;
        gap: 12px;
        padding: 0 18px;
      }
      .mad-universe-kicker { justify-content: center; }
      .mad-universe-track { gap: 28px; animation-duration: 52s; }
      .mad-universe-link img { height: 20px; max-width: 142px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .mad-universe-track {
        animation: none;
        flex-wrap: wrap;
        justify-content: center;
        width: auto;
      }
      .mad-universe-marquee {
        -webkit-mask-image: none;
        mask-image: none;
      }
    }
  `],
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
            <h1 class="max-w-3xl text-5xl font-bold leading-tight text-slate-950 md:text-6xl">Turn training into momentum.</h1>
            <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              AI-powered learning management for South African teams, with structured courses, progress tracking, assessments, and MAD Cloud task validation.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <button mat-flat-button color="primary" (click)="openApp()">
                <mat-icon>login</mat-icon>
                Start learning now
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
      <section class="mad-universe-strip" aria-label="Explore the MAD universe">
        <div class="mad-universe-inner">
          <p class="mad-universe-kicker"><span aria-hidden="true">*</span> The MAD universe</p>
          <div class="mad-universe-marquee">
            <div class="mad-universe-track">
              @for (app of madUniverseApps.concat(madUniverseApps); track app.name + $index) {
                <a class="mad-universe-link" [href]="app.url" target="_blank" rel="noopener" [attr.aria-label]="app.name">
                  @if (app.logo) {
                    <img [src]="app.logo" [alt]="app.name" loading="lazy" decoding="async" />
                  } @else {
                    <span class="mad-universe-text">{{ app.name }}</span>
                  }
                </a>
              }
            </div>
          </div>
        </div>
      </section>
      <section class="bg-slate-950 px-6 py-12 text-white">
        <div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-violet-300">Ready when your team is</p>
            <h2 class="mt-2 text-3xl font-bold">Launch a course, track every learner, and prove progress.</h2>
          </div>
          <button mat-flat-button color="primary" (click)="openApp()">
            <mat-icon>rocket_launch</mat-icon>
            Open MADLearn
          </button>
        </div>
      </section>
    </main>
  `
})
export class HomeComponent {
  protected readonly madUniverseApps = MAD_UNIVERSE_APPS;

  private auth = inject(AuthService);
  private router = inject(Router);

  openApp() {
    this.router.navigate([this.auth.isLoggedIn() ? '/dashboard' : '/login']);
  }
}
