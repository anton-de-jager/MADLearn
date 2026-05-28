import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminLearningInsights, EvidencePack, LearningEvent, LearningPath } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LearningIntelligenceService {
  constructor(private http: HttpClient) {}

  getPath(): Observable<LearningPath> {
    return this.http.get<LearningPath>(`${environment.apiUrl}/learning-intelligence/path`);
  }

  getEvidencePack(): Observable<EvidencePack> {
    return this.http.get<EvidencePack>(`${environment.apiUrl}/learning-intelligence/evidence-pack`);
  }

  getEvents(): Observable<LearningEvent[]> {
    return this.http.get<LearningEvent[]>(`${environment.apiUrl}/learning-intelligence/events`);
  }

  getAdminInsights(): Observable<AdminLearningInsights> {
    return this.http.get<AdminLearningInsights>(`${environment.apiUrl}/learning-intelligence/admin-insights`);
  }
}
