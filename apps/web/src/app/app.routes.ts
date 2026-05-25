import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/student/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'courses/:courseId/modules',
        loadComponent: () => import('./features/student/course-view/course-view.component').then(m => m.CourseViewComponent)
      },
      {
        path: 'lessons/:id',
        loadComponent: () => import('./features/student/lesson-viewer/lesson-viewer.component').then(m => m.LessonViewerComponent)
      },
      {
        path: 'tests/:lessonId',
        loadComponent: () => import('./features/student/test-screen/test-screen.component').then(m => m.TestScreenComponent)
      },
      {
        path: 'my-progress',
        loadComponent: () => import('./features/student/my-progress/my-progress.component').then(m => m.MyProgressComponent)
      },
      {
        path: 'mad-cloud',
        loadComponent: () => import('./features/mad-cloud/mad-cloud.component').then(m => m.MadCloudComponent)
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'users/:id',
            loadComponent: () => import('./features/admin/user-detail/user-detail.component').then(m => m.UserDetailComponent)
          }
        ]
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
