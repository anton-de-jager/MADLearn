import { Component, inject } from '@angular/core';
import { PayfastSubscribeComponent } from '../../shared/payfast/payfast-subscribe.component';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

type MadUniverseApp = {
  name: string;
  url: string;
  logo?: string;
};

const MAD_UNIVERSE_APPS: MadUniverseApp[] = [
  { name: 'MAD Prospects', url: 'https://madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-madprospects.png' },
  { name: 'MADAuthor', url: 'https://madauthor.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADAuthor.png' },
  { name: 'MAD Cloud', url: 'https://madcloud.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADCloud.png' },
  { name: 'MADCreate', url: 'https://madcreate.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADCreate.png' },
  { name: 'MADHub', url: 'https://madhub.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADHub.png' },
  { name: 'MADLeads', url: 'https://madleads.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADLeads.png' },
  { name: 'MADLearn', url: 'https://madlearn.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADLearn.png' },
  { name: 'MADLove', url: 'https://madlove.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADLove.png' },
  { name: 'MADMultisciple', url: 'https://madmultisciple.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADMultisciple.png' },
  { name: 'MADPulse', url: 'https://madpulse.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADPulse.png' },
  { name: 'MADRecruiting', url: 'https://madrecruiting.madprospects.com/', logo: 'https://madprospects.com/media/logo-wide-MADRecruiting.png' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, PayfastSubscribeComponent],
  styles: [`
    :host { --mad-primary: #FF7B00; --mad-secondary: #FF3D00; --mad-primary-soft: #FFEFE0; --mad-secondary-soft: #FFE2D9; }
    .text-violet-600, .text-violet-700 { color: var(--mad-primary) !important; }
    .text-violet-300, .text-violet-200, .text-amber-600 { color: var(--mad-secondary) !important; }
    .bg-violet-50, .bg-violet-100 { background-color: var(--mad-primary-soft) !important; }
    .border-violet-100, .border-violet-600 { border-color: var(--mad-primary) !important; }

    .mad-universe-strip {
      position: relative;
      overflow: hidden;
      background: #0d1628;
      border-top: 1px solid rgba(148, 163, 184, 0.10);
      border-bottom: 1px solid rgba(148, 163, 184, 0.10);
      padding: 8px 0;
    }
    .mad-universe-inner {
      display: flex;
      align-items: center;
      gap: 16px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 0 24px;
    }
    .mad-universe-kicker {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: #FF3D00;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .mad-universe-kicker span { color: #FF7B00; }
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
      gap: 28px;
      width: max-content;
      animation: madUniverseScroll 44s linear infinite;
    }
    .mad-universe-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: max-content;
      opacity: 0.70;
      text-decoration: none;
      transition: opacity 160ms ease, transform 160ms ease;
    }
    .mad-universe-link:hover { opacity: 1; transform: translateY(-1px); }
    .mad-universe-link img {
      display: block;
      width: auto;
      max-width: 120px;
      height: 16px;
      object-fit: contain;
      filter: drop-shadow(0 0 8px rgba(255,255,255,0.06));
    }
    .mad-universe-text {
      color: #94a3b8;
      font-size: 10px;
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
        gap: 8px;
        padding: 0 18px;
      }
      .mad-universe-kicker { justify-content: center; }
      .mad-universe-track { gap: 20px; animation-duration: 52s; }
      .mad-universe-link img { height: 14px; max-width: 100px; }
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

      <!-- Nav -->
      <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <img src="assets/logo-wide.png" alt="MADLearn" class="h-10 w-auto">
        <div class="flex items-center gap-3">
          <a routerLink="/billing" mat-stroked-button aria-label="View MADLearn Payfast.io plans">Plans</a>
          <a routerLink="/login" mat-stroked-button aria-label="Sign in to MADLearn">Sign in</a>
          <button mat-flat-button color="primary" (click)="openApp()" aria-label="Open MADLearn app">
            <mat-icon>school</mat-icon>
            Open app
          </button>
        </div>
      </nav>

      <!-- Hero -->
      <section class="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-16">
        <div class="grid items-center gap-10 md:grid-cols-[1fr_0.8fr]">
          <div>
            <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-violet-600">MADCloud-powered LMS for South Africa</p>
            <h1 class="max-w-3xl text-5xl font-bold leading-tight text-slate-950 md:text-6xl">Turn training into momentum.</h1>
            <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              MADLearn is the learning management system built for South African businesses.
              Create structured courses, track every learner's progress, run assessments, and
              validate real-world task completion through MAD Cloud integration &mdash; all from
              one platform your team will actually use.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <button mat-flat-button color="primary" (click)="openApp()" aria-label="Start learning now">
                <mat-icon>login</mat-icon>
                Start learning now
              </button>
              <a routerLink="/register" mat-stroked-button aria-label="Create a free MADLearn account">
                <mat-icon>person_add</mat-icon>
                Create free account
              </a>
            </div>
            <p class="mt-4 text-sm text-slate-400">No credit card required. Free tier available.</p>
          </div>

          <div class="rounded-lg border border-violet-100 bg-violet-50 p-6">
            <img src="assets/logo.png" alt="MADLearn logo" class="mx-auto mb-6 h-28 w-auto">
            <div class="grid gap-3 text-sm text-slate-700">
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-violet-600">verified</mat-icon> Branded course delivery</div>
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-amber-600">query_stats</mat-icon> Learner progress evidence</div>
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-violet-600">cloud_done</mat-icon> MAD Cloud task execution</div>
              <div class="flex items-center gap-3 rounded bg-white p-3"><mat-icon class="text-amber-600">smart_toy</mat-icon> MADCloud-assisted content creation</div>
            </div>
          </div>
        </div>
      </section>

      <!-- MAD Universe marquee (compact) -->
      <section class="mad-universe-strip" aria-label="Explore the MAD Universe of apps">
        <div class="mad-universe-inner">
          <p class="mad-universe-kicker"><span aria-hidden="true">&#9670;</span> MAD Universe</p>
          <div class="mad-universe-marquee" role="marquee">
            <div class="mad-universe-track">
              @for (app of madUniverseMarqueeApps; track app.name + $index) {
                <a class="mad-universe-link" [href]="app.url" target="_blank" rel="noopener" [attr.aria-label]="'Visit ' + app.name">
                  @if (app.logo) {
                    <img [src]="app.logo" [alt]="app.name + ' logo'" loading="lazy" decoding="async" />
                  } @else {
                    <span class="mad-universe-text">{{ app.name }}</span>
                  }
                </a>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="bg-slate-50 px-6 py-20" aria-labelledby="features-heading">
        <div class="mx-auto max-w-6xl">
          <p class="text-sm font-semibold uppercase tracking-wide text-violet-600">Platform features</p>
          <h2 id="features-heading" class="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">Everything your training team needs</h2>
          <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            From onboarding new hires to upskilling experienced staff, MADLearn gives teams a clear way
            to deliver structured courses, follow learning paths, and measure outcomes with confidence.
          </p>

          <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <mat-icon class="mb-3 text-violet-600" style="font-size:32px;width:32px;height:32px;">menu_book</mat-icon>
              <h3 class="text-lg font-bold text-slate-950">Structured Courses</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Deliver training as courses, modules, and lessons with clear sequencing. Learners follow a structured path from start to finish.</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <mat-icon class="mb-3 text-violet-600" style="font-size:32px;width:32px;height:32px;">quiz</mat-icon>
              <h3 class="text-lg font-bold text-slate-950">Assessments &amp; Quizzes</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Attach quizzes to any lesson to test understanding. Multiple choice, true/false, and free-text questions with automatic grading and pass-mark thresholds.</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <mat-icon class="mb-3 text-amber-600" style="font-size:32px;width:32px;height:32px;">trending_up</mat-icon>
              <h3 class="text-lg font-bold text-slate-950">Progress Tracking</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Real-time dashboards show exactly where each learner stands. Managers see completion rates, quiz scores, and time-on-task at a glance across their entire team.</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <mat-icon class="mb-3 text-violet-600" style="font-size:32px;width:32px;height:32px;">cloud_sync</mat-icon>
              <h3 class="text-lg font-bold text-slate-950">MAD Cloud Integration</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Connect learning to real work. MADCloud tasks support hands-on coaching, remediation, practice, and evidence summaries.</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <mat-icon class="mb-3 text-amber-600" style="font-size:32px;width:32px;height:32px;">smart_toy</mat-icon>
              <h3 class="text-lg font-bold text-slate-950">MADCloud Course Assist</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Use MADCloud to create learner support, practice prompts, remediation plans, and evidence summaries from the current training context.</p>
            </div>
            <div class="rounded-lg border border-slate-200 bg-white p-6">
              <mat-icon class="mb-3 text-violet-600" style="font-size:32px;width:32px;height:32px;">admin_panel_settings</mat-icon>
              <h3 class="text-lg font-bold text-slate-950">Admin Dashboard</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Review learner progress, test results, skills, interventions, and at-risk learners from a single admin command centre.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="bg-white px-6 py-20" aria-labelledby="how-heading">
        <div class="mx-auto max-w-6xl">
          <p class="text-sm font-semibold uppercase tracking-wide text-violet-600">How it works</p>
          <h2 id="how-heading" class="mt-3 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">Three steps to training that sticks</h2>

          <div class="mt-12 grid gap-8 md:grid-cols-3">
            <div class="text-center">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-2xl font-black text-violet-600">1</div>
              <h3 class="mt-5 text-lg font-bold text-slate-950">Open a course</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Browse available courses, open modules, complete lessons, and use MADCloud Coach for support when a topic needs extra practice.</p>
            </div>
            <div class="text-center">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-2xl font-black text-violet-600">2</div>
              <h3 class="mt-5 text-lg font-bold text-slate-950">Track learning</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Follow lesson completion, time spent, quiz results, personalized next actions, and progress evidence from the learner dashboard.</p>
            </div>
            <div class="text-center">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-2xl font-black text-violet-600">3</div>
              <h3 class="mt-5 text-lg font-bold text-slate-950">Track &amp; prove progress</h3>
              <p class="mt-2 text-sm leading-6 text-slate-600">Review evidence packs, certificate readiness, assessment outcomes, and MADCloud activity from learner and admin views.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="bg-slate-50 px-6 py-20" aria-labelledby="pricing-heading">
        <div class="mx-auto max-w-6xl">
          <p class="text-sm font-semibold uppercase tracking-wide text-violet-600">Pricing plans</p>
          <div class="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h2 id="pricing-heading" class="max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-5xl">Train one learner today. Scale the academy tomorrow.</h2>
              <p class="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Start free, add teams when your training program needs structured learning, evidence, and reporting that leadership can trust.</p>
            </div>
            <button mat-flat-button color="primary" (click)="openApp()" aria-label="Start training with MADLearn">
              <mat-icon>rocket_launch</mat-icon>
              Start training
            </button>
          </div>

          <div class="mt-10 grid gap-4 md:grid-cols-3">
            <article class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 class="text-xl font-bold text-slate-950">Starter</h3>
              <div class="mt-5 text-4xl font-black text-slate-950">Free</div>
              <p class="mt-2 text-sm text-slate-500">For first courses and solo learners.</p>
              <ul class="mt-6 grid gap-3 text-sm text-slate-600">
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> 1 course workspace</li>
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Core progress tracking</li>
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Basic assessments</li>
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Community support</li>
              </ul>
              <button class="mt-7 w-full" mat-stroked-button color="primary" (click)="openApp()" aria-label="Start free with MADLearn Starter plan">Start free</button>
            </article>

            <article class="rounded-lg border-2 border-violet-600 bg-slate-950 p-6 text-white shadow-xl">
              <div class="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase text-violet-700">Most popular</div>
              <h3 class="mt-4 text-xl font-bold">Team</h3>
              <div class="mt-5 text-4xl font-black">$49<span class="text-base font-semibold text-violet-200">/mo</span></div>
              <p class="mt-2 text-sm text-slate-300">For teams running structured training.</p>
              <ul class="mt-6 grid gap-3 text-sm text-slate-200">
                <li class="flex gap-2"><mat-icon class="text-violet-300">check_circle</mat-icon> 10 active learners</li>
                <li class="flex gap-2"><mat-icon class="text-violet-300">check_circle</mat-icon> Course catalogue access</li>
                <li class="flex gap-2"><mat-icon class="text-violet-300">check_circle</mat-icon> Evidence and certificate readiness</li>
                <li class="flex gap-2"><mat-icon class="text-violet-300">check_circle</mat-icon> Manager reporting dashboard</li>
              </ul>
              <button class="mt-7 w-full" mat-flat-button color="primary" (click)="openApp()" aria-label="Start a free trial of the MADLearn Team plan">Start trial</button>
            </article>

            <article class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 class="text-xl font-bold text-slate-950">Academy</h3>
              <div class="mt-5 text-4xl font-black text-slate-950">$149<span class="text-base font-semibold text-slate-500">/mo</span></div>
              <p class="mt-2 text-sm text-slate-500">For full academies and client portals.</p>
              <ul class="mt-6 grid gap-3 text-sm text-slate-600">
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Expanded learner operations</li>
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Advanced analytics dashboards</li>
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Advanced evidence workflows</li>
                <li class="flex gap-2"><mat-icon class="text-violet-600">check_circle</mat-icon> Dedicated onboarding support</li>
              </ul>
              <button class="mt-7 w-full" mat-stroked-button color="primary" (click)="openApp()" aria-label="Contact sales for the MADLearn Academy plan">Talk to sales</button>
            </article>
          </div>
        </div>
      </section>

      <div class="bg-white px-6 py-12"><div class="mx-auto max-w-6xl"><app-payfast-subscribe productName="MADLearn" headline="Train your team with Payfast.io" lead="Choose the learning plan, confirm your receipt email, and open secure onsite checkout." [compact]="true"></app-payfast-subscribe></div></div>

      <!-- Bottom CTA -->
      <section class="bg-slate-950 px-6 py-14 text-white" aria-labelledby="cta-heading">
        <div class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-violet-300">Ready when your team is</p>
            <h2 id="cta-heading" class="mt-2 text-3xl font-bold">Launch a course, track every learner, and prove progress &mdash; today.</h2>
            <p class="mt-3 max-w-xl text-base text-slate-400">Join South African businesses already using MADLearn to deliver training that's measurable, structured, and connected to real outcomes.</p>
          </div>
          <button mat-flat-button color="primary" (click)="openApp()" aria-label="Open MADLearn and start training">
            <mat-icon>rocket_launch</mat-icon>
            Open MADLearn
          </button>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-slate-950 border-t border-slate-800 px-6 py-6 text-center text-xs text-slate-500">
        &copy; {{ currentYear }} MAD Prospects. MADLearn is part of the MAD Universe.
      </footer>
    </main>
  `
})
export class HomeComponent {
  protected readonly madUniverseApps: MadUniverseApp[] = MAD_UNIVERSE_APPS;
  protected readonly madUniverseMarqueeApps: MadUniverseApp[] = [...MAD_UNIVERSE_APPS, ...MAD_UNIVERSE_APPS];
  protected readonly currentYear = new Date().getFullYear();

  private auth = inject(AuthService);
  private router = inject(Router);

  openApp() {
    this.router.navigate([this.auth.isLoggedIn() ? '/dashboard' : '/login']);
  }
}
