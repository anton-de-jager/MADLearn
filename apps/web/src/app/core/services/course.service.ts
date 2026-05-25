import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course, LessonDetail, Module, Lesson } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CourseService {
  constructor(private http: HttpClient) {}

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${environment.apiUrl}/courses`);
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`${environment.apiUrl}/courses/${id}`);
  }

  getModules(courseId: number): Observable<Module[]> {
    return this.http.get<Module[]>(`${environment.apiUrl}/courses/${courseId}/modules`);
  }

  getLessons(moduleId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${environment.apiUrl}/modules/${moduleId}/lessons`);
  }

  getLesson(id: number): Observable<LessonDetail> {
    return this.http.get<LessonDetail>(`${environment.apiUrl}/lessons/${id}`);
  }
}
