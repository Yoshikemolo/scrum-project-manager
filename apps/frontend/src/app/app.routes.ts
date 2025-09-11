/**
 * Application routing configuration.
 * Defines all routes and lazy-loaded modules.
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { animation: 'DashboardPage' }
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECTS_ROUTES),
    data: { animation: 'ProjectsPage' }
  },
  {
    path: 'sprints',
    canActivate: [authGuard],
    loadChildren: () => import('./features/sprints/sprints.routes').then(m => m.SPRINTS_ROUTES),
    data: { animation: 'SprintsPage' }
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.TASKS_ROUTES),
    data: { animation: 'TasksPage' }
  },
  {
    path: 'reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'manager'], animation: 'ReportsPage' },
    loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
  },
  {
    path: 'team',
    canActivate: [authGuard],
    loadChildren: () => import('./features/team/team.routes').then(m => m.TEAM_ROUTES),
    data: { animation: 'TeamPage' }
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES),
    data: { animation: 'ProfilePage' }
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
    data: { animation: 'SettingsPage' }
  },
  {
    path: 'ai-assistant',
    canActivate: [authGuard],
    loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
    data: { animation: 'AiAssistantPage' }
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    data: { animation: 'NotificationsPage' }
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'error',
    loadChildren: () => import('./features/error/error.routes').then(m => m.ERROR_ROUTES)
  },
  {
    path: '**',
    redirectTo: '/error/404'
  }
];
