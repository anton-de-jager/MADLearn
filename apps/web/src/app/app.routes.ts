import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'ai', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/madcloud-ai/madcloud-ai.page').then((m) => m.MadcloudAiPage) },

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
    path: 'billing',
    loadComponent: () => import('./features/billing/billing.component').then(m => m.BillingComponent)
  },
  {
    path: 'billing/success',
    loadComponent: () => import('./features/billing/billing-result.component').then(m => m.BillingResultComponent)
  },
  {
    path: 'billing/cancelled',
    loadComponent: () => import('./features/billing/billing-result.component').then(m => m.BillingResultComponent)
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
        path: 'courses',
        loadComponent: () => import('./features/student/courses/courses.component').then(m => m.CoursesComponent)
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
        path: 'evidence',
        loadComponent: () => import('./features/student/evidence/evidence.component').then(m => m.EvidenceComponent)
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
            data: { tabIndex: 0 },
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'learners',
            data: { tabIndex: 1 },
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'test-results',
            data: { tabIndex: 2 },
            loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'skills-interventions',
            data: { tabIndex: 0 },
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
