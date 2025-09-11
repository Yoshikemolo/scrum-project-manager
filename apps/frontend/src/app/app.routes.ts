/**
 * Application routing configuration.
 * Defines all routes, lazy loading, guards, and route data.
 * 
 * @module AppRoutes
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

/**
 * Application routes configuration
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
    data: { animation: 'AuthPage' },
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { 
      animation: 'DashboardPage',
      title: 'Dashboard',
      breadcrumb: 'Dashboard',
    },
  },
  {
    path: 'projects',
    loadChildren: () => import('./features/projects/projects.routes').then(m => m.PROJECT_ROUTES),
    canActivate: [authGuard],
    data: { 
      animation: 'ProjectsPage',
      title: 'Projects',
      breadcrumb: 'Projects',
    },
  },
  {
    path: 'tasks',
    loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.TASK_ROUTES),
    canActivate: [authGuard],
    data: { 
      animation: 'TasksPage',
      title: 'Tasks',
      breadcrumb: 'Tasks',
    },
  },
  {
    path: 'sprints',
    loadChildren: () => import('./features/sprints/sprints.routes').then(m => m.SPRINT_ROUTES),
    canActivate: [authGuard],
    data: { 
      animation: 'SprintsPage',
      title: 'Sprints',
      breadcrumb: 'Sprints',
    },
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES),
    canActivate: [authGuard],
    data: { 
      animation: 'ReportsPage',
      title: 'Reports',
      breadcrumb: 'Reports',
    },
  },
  {
    path: 'team',
    loadChildren: () => import('./features/team/team.routes').then(m => m.TEAM_ROUTES),
    canActivate: [authGuard],
    data: { 
      animation: 'TeamPage',
      title: 'Team',
      breadcrumb: 'Team',
    },
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.routes').then(m => m.SETTINGS_ROUTES),
    canActivate: [authGuard],
    canDeactivate: [pendingChangesGuard],
    data: { 
      animation: 'SettingsPage',
      title: 'Settings',
      breadcrumb: 'Settings',
    },
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard],
    data: { 
      animation: 'AdminPage',
      title: 'Administration',
      breadcrumb: 'Admin',
      roles: ['admin', 'super_admin'],
    },
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./features/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent),
    canActivate: [authGuard],
    data: { 
      animation: 'AiAssistantPage',
      title: 'AI Assistant',
      breadcrumb: 'AI Assistant',
    },
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: { 
      animation: 'ProfilePage',
      title: 'Profile',
      breadcrumb: 'Profile',
    },
  },
  {
    path: 'notifications',
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [authGuard],
    data: { 
      animation: 'NotificationsPage',
      title: 'Notifications',
      breadcrumb: 'Notifications',
    },
  },
  {
    path: 'help',
    loadChildren: () => import('./features/help/help.routes').then(m => m.HELP_ROUTES),
    data: { 
      animation: 'HelpPage',
      title: 'Help & Support',
      breadcrumb: 'Help',
    },
  },
  {
    path: '404',
    loadComponent: () => import('./shared/pages/not-found/not-found.component').then(m => m.NotFoundComponent),
    data: { 
      animation: 'NotFoundPage',
      title: 'Page Not Found',
    },
  },
  {
    path: 'maintenance',
    loadComponent: () => import('./shared/pages/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
    data: { 
      animation: 'MaintenancePage',
      title: 'Under Maintenance',
    },
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
