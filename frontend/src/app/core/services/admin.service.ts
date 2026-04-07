import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TestResult, UserDetail, UserSummary } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${environment.apiUrl}/admin/users`);
  }

  getUserDetail(id: number): Observable<UserDetail> {
    return this.http.get<UserDetail>(`${environment.apiUrl}/admin/users/${id}`);
  }

  getTestResults(courseId?: number): Observable<TestResult[]> {
    const params = courseId ? `?courseId=${courseId}` : '';
    return this.http.get<TestResult[]>(`${environment.apiUrl}/admin/test-results${params}`);
  }
}
