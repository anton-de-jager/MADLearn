import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { TestService } from '../../../core/services/test.service';
import { Test, TestResult } from '../../../core/models/models';

@Component({
  selector: 'app-test-screen',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatRadioModule, MatProgressBarModule, FormsModule],
  template: `
    <div class="page-container max-w-3xl mx-auto">
      @if (!test && !result) {
        <div class="flex items-center justify-center h-64">
          <p class="text-gray-500">Loading test...</p>
        </div>
      }

      @if (test && !result) {
        <!-- Test Header -->
        <mat-card class="p-6 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h1 class="text-2xl font-bold text-gray-900">{{ test.title }}</h1>
            <span class="badge badge-info">Pass: {{ test.passingScore }}%</span>
          </div>
          <div class="progress-bar-custom">
            <div class="fill" [style.width.%]="progressPercent"></div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Question {{ currentIndex + 1 }} of {{ test.questions.length }}</p>
        </mat-card>

        <!-- Current Question -->
        <mat-card class="p-8">
          <h2 class="text-lg font-semibold text-gray-800 mb-6">
            {{ currentIndex + 1 }}. {{ currentQuestion?.text }}
          </h2>

          <div class="space-y-3">
            @for (answer of currentQuestion?.answers; track answer.id) {
              <div
                class="border-2 rounded-xl p-4 cursor-pointer transition-all"
                [class.border-blue-500]="selectedAnswers[currentQuestion!.id] === answer.id"
                [class.bg-violet-50]="selectedAnswers[currentQuestion!.id] === answer.id"
                [class.border-gray-200]="selectedAnswers[currentQuestion!.id] !== answer.id"
                (click)="selectAnswer(currentQuestion!.id, answer.id)">
                <div class="flex items-center gap-3">
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                       [class.border-blue-500]="selectedAnswers[currentQuestion!.id] === answer.id"
                       [class.border-gray-300]="selectedAnswers[currentQuestion!.id] !== answer.id">
                    @if (selectedAnswers[currentQuestion!.id] === answer.id) {
                      <div class="w-3 h-3 rounded-full bg-violet-500"></div>
                    }
                  </div>
                  <span class="text-gray-700">{{ answer.text }}</span>
                </div>
              </div>
            }
          </div>

          <div class="flex items-center justify-between mt-8">
            <button mat-stroked-button (click)="prev()" [disabled]="currentIndex === 0">
              <mat-icon>arrow_back</mat-icon> Previous
            </button>

            @if (currentIndex < test.questions.length - 1) {
              <button mat-flat-button color="primary" (click)="next()" [disabled]="!selectedAnswers[currentQuestion!.id]">
                Next <mat-icon>arrow_forward</mat-icon>
              </button>
            } @else {
              <button mat-flat-button color="accent" (click)="submit()"
                      [disabled]="!allAnswered || submitting">
                {{ submitting ? 'Submitting...' : 'Submit Test' }}
              </button>
            }
          </div>
        </mat-card>

        <!-- Answer Progress -->
        <div class="flex gap-2 mt-4 flex-wrap">
          @for (q of test.questions; track q.id; let i = $index) {
            <button
              class="w-10 h-10 rounded-lg font-semibold text-sm border-2 transition-colors"
              [class.bg-violet-600]="i === currentIndex"
              [class.text-white]="i === currentIndex"
              [class.border-blue-600]="i === currentIndex"
              [class.bg-green-100]="i !== currentIndex && selectedAnswers[q.id]"
              [class.border-green-400]="i !== currentIndex && selectedAnswers[q.id]"
              [class.text-green-700]="i !== currentIndex && selectedAnswers[q.id]"
              [class.bg-gray-100]="i !== currentIndex && !selectedAnswers[q.id]"
              [class.border-gray-300]="i !== currentIndex && !selectedAnswers[q.id]"
              (click)="goTo(i)">
              {{ i + 1 }}
            </button>
          }
        </div>
      }

      <!-- Result Screen -->
      @if (result) {
        <mat-card class="p-10 text-center">
          <div class="mb-6">
            @if (result.passed) {
              <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <mat-icon class="text-green-600" style="font-size:48px">check_circle</mat-icon>
              </div>
              <h1 class="text-3xl font-bold text-green-700">Congratulations!</h1>
              <p class="text-gray-500 mt-2">You passed the test!</p>
            } @else {
              <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <mat-icon class="text-red-500" style="font-size:48px">cancel</mat-icon>
              </div>
              <h1 class="text-3xl font-bold text-red-600">Not Quite</h1>
              <p class="text-gray-500 mt-2">Keep studying and try again!</p>
            }
          </div>

          <div class="text-6xl font-black mb-2"
               [class.text-green-600]="result.passed"
               [class.text-red-500]="!result.passed">
            {{ result.score }}%
          </div>
          <p class="text-gray-500">{{ result.testTitle }}</p>

          <div class="flex gap-4 justify-center mt-8">
            <a [routerLink]="['/lessons', lessonId]">
              <button mat-stroked-button>
                <mat-icon>arrow_back</mat-icon> Back to Lesson
              </button>
            </a>
            <a routerLink="/dashboard">
              <button mat-flat-button color="primary">
                <mat-icon>home</mat-icon> Dashboard
              </button>
            </a>
          </div>
        </mat-card>
      }
    </div>
  `
})
export class TestScreenComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private testService = inject(TestService);

  test: Test | null = null;
  result: TestResult | null = null;
  currentIndex = 0;
  selectedAnswers: Record<number, number> = {};
  submitting = false;
  lessonId = 0;

  get currentQuestion() { return this.test?.questions[this.currentIndex]; }
  get progressPercent() { return this.test ? ((this.currentIndex + 1) / this.test.questions.length) * 100 : 0; }
  get allAnswered() { return this.test?.questions.every(q => this.selectedAnswers[q.id]) ?? false; }

  ngOnInit() {
    this.lessonId = +this.route.snapshot.params['lessonId'];
    this.testService.getTestByLesson(this.lessonId).subscribe(t => this.test = t);
  }

  selectAnswer(questionId: number, answerId: number) {
    this.selectedAnswers[questionId] = answerId;
  }

  next() { if (this.currentIndex < (this.test?.questions.length ?? 0) - 1) this.currentIndex++; }
  prev() { if (this.currentIndex > 0) this.currentIndex--; }
  goTo(i: number) { this.currentIndex = i; }

  submit() {
    if (!this.test || !this.allAnswered) return;
    this.submitting = true;

    const dto = {
      testId: this.test.id,
      answers: Object.entries(this.selectedAnswers).map(([qId, aId]) => ({
        questionId: +qId,
        answerId: aId
      }))
    };

    this.testService.submitTest(dto).subscribe(r => {
      this.result = r;
      this.submitting = false;
    });
  }
}
