import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubmitTestDto, Test, TestResult } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TestService {
  constructor(private http: HttpClient) {}

  getTestByLesson(lessonId: number): Observable<Test> {
    return this.http.get<Test>(`${environment.apiUrl}/tests/lesson/${lessonId}`);
  }

  submitTest(dto: SubmitTestDto): Observable<TestResult> {
    return this.http.post<TestResult>(`${environment.apiUrl}/tests/submit`, dto);
  }

  getMyResults(): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${environment.apiUrl}/tests/results`);
  }
}
