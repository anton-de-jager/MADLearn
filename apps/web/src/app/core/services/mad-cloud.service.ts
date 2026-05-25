import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MadCloudTask, MadCloudTaskRequest } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MadCloudService {
  constructor(private http: HttpClient) {}

  submitTask(dto: MadCloudTaskRequest): Observable<MadCloudTask> {
    return this.http.post<MadCloudTask>(`${environment.apiUrl}/mad-cloud/tasks`, dto);
  }

  getTask(id: number): Observable<MadCloudTask> {
    return this.http.get<MadCloudTask>(`${environment.apiUrl}/mad-cloud/tasks/${id}`);
  }
}
