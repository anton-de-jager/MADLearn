import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MadCloudAssistRequest, MadCloudTask, MadCloudTaskRequest } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MadCloudService {
  constructor(private http: HttpClient) {}

  submitTask(dto: MadCloudTaskRequest): Observable<MadCloudTask> {
    return this.http.post<MadCloudTask>(`${environment.apiUrl}/mad-cloud/tasks`, dto);
  }

  submitAssist(dto: MadCloudAssistRequest): Observable<MadCloudTask> {
    return this.http.post<MadCloudTask>(`${environment.apiUrl}/mad-cloud/assist`, dto);
  }

  getMyTasks(): Observable<MadCloudTask[]> {
    return this.http.get<MadCloudTask[]>(`${environment.apiUrl}/mad-cloud/tasks`);
  }

  getTask(id: number): Observable<MadCloudTask> {
    return this.http.get<MadCloudTask>(`${environment.apiUrl}/mad-cloud/tasks/${id}`);
  }
}
