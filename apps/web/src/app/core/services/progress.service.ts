import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgressSummary, UserProgress } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  constructor(private http: HttpClient) {}

  getMyProgress(): Observable<UserProgress[]> {
    return this.http.get<UserProgress[]>(`${environment.apiUrl}/progress`);
  }

  getSummary(): Observable<ProgressSummary> {
    return this.http.get<ProgressSummary>(`${environment.apiUrl}/progress/summary`);
  }

  completeLesson(lessonId: number, timeSpentMinutes: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/progress/complete`, { lessonId, timeSpentMinutes });
  }

  updateTime(lessonId: number, timeSpentMinutes: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/progress/time`, { lessonId, timeSpentMinutes });
  }
}
