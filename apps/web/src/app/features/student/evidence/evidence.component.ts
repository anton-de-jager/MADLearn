import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { EvidencePack, LearningEvent } from '../../../core/models/models';
import { LearningIntelligenceService } from '../../../core/services/learning-intelligence.service';

@Component({
  selector: 'app-evidence',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-bold uppercase tracking-wide text-violet-600">Evidence & certificates</p>
          <h1 class="mt-2 text-3xl font-bold text-gray-900">Learning Evidence</h1>
          <p class="mt-1 max-w-2xl text-gray-500">Review completed lessons, assessments, MADCloud activity, and certificate readiness in one place.</p>
        </div>
        <a routerLink="/my-progress">
          <button mat-stroked-button>
            <mat-icon>trending_up</mat-icon> My Progress
          </button>
        </a>
      </div>

      @if (evidencePack) {
        <mat-card class="mb-8 overflow-hidden">
          <div class="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div class="bg-violet-50 p-6">
              <p class="text-sm font-bold uppercase tracking-wide text-violet-700">Certificate status</p>
              <h2 class="mt-2 text-2xl font-bold text-gray-950">{{ evidencePack.certificateReady ? 'Certificate Ready' : 'Evidence Building' }}</h2>
              <p class="mt-3 text-sm leading-6 text-gray-700">{{ evidencePack.certificateStatus }}</p>
              <div class="mt-6 grid gap-3 sm:grid-cols-3">
                <div class="rounded bg-white p-4 shadow-sm">
                  <p class="text-sm text-gray-500">Lessons</p>
                  <p class="mt-1 text-2xl font-black text-violet-700">{{ evidencePack.completedLessons }}</p>
                </div>
                <div class="rounded bg-white p-4 shadow-sm">
                  <p class="text-sm text-gray-500">Tests</p>
                  <p class="mt-1 text-2xl font-black text-green-700">{{ evidencePack.testsTaken }}</p>
                </div>
                <div class="rounded bg-white p-4 shadow-sm">
                  <p class="text-sm text-gray-500">Average</p>
                  <p class="mt-1 text-2xl font-black text-purple-700">{{ evidencePack.averageScore }}%</p>
                </div>
              </div>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900">{{ evidencePack.learnerName }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ evidencePack.learnerEmail }}</p>
              <div class="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <div class="flex items-start gap-3">
                  <mat-icon class="text-gray-500">picture_as_pdf</mat-icon>
                  <div>
                    <p class="font-bold text-gray-900">Evidence export</p>
                    <p class="mt-1 text-sm leading-6 text-gray-600">The evidence data is ready for a future PDF export action. Current view keeps the proof bundle accessible in-app.</p>
                  </div>
                </div>
              </div>
              <a routerLink="/mad-cloud" class="mt-5 inline-flex">
                <button mat-flat-button color="primary">
                  <mat-icon>workspace_premium</mat-icon> Summarize with MADCloud
                </button>
              </a>
            </div>
          </div>
        </mat-card>
      }

      <mat-card class="p-6">
        <div class="mb-5 flex items-center gap-3">
          <mat-icon class="text-violet-600">timeline</mat-icon>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Evidence Timeline</h2>
            <p class="text-sm text-gray-500">Canonical activity signals for learning, assessment, certificates, and MADCloud tasks.</p>
          </div>
        </div>
        <div class="grid gap-3">
          @for (event of events; track event.type + event.occurredAt + event.title) {
            <article class="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4">
              <mat-icon class="text-violet-600">{{ iconFor(event.type) }}</mat-icon>
              <div>
                <p class="font-semibold text-gray-900">{{ event.title }}</p>
                <p class="mt-1 text-xs text-gray-500">{{ event.type }} · {{ event.occurredAt | date:'MMM d, y h:mm a' }}</p>
              </div>
            </article>
          }
          @if (!events.length) {
            <div class="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">Evidence events will appear after lesson, test, or MADCloud activity.</div>
          }
        </div>
      </mat-card>
    </div>
  `
})
export class EvidenceComponent implements OnInit {
  private learningIntelligence = inject(LearningIntelligenceService);
  evidencePack: EvidencePack | null = null;
  events: LearningEvent[] = [];

  ngOnInit() {
    this.learningIntelligence.getEvidencePack().subscribe(pack => this.evidencePack = pack);
    this.learningIntelligence.getEvents().subscribe(events => this.events = events);
  }

  iconFor(type: string): string {
    if (type.includes('Test')) return 'quiz';
    if (type.includes('MadCloud')) return 'cloud_done';
    if (type.includes('Certificate')) return 'workspace_premium';
    return 'task_alt';
  }
}
