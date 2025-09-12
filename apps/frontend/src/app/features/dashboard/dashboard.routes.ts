/**
 * Dashboard routing configuration
 */
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    data: {
      title: 'Dashboard',
      breadcrumb: 'Dashboard',
      animation: 'dashboard'
    }
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [AuthGuard],
    data: {
      title: 'Analytics',
      breadcrumb: 'Analytics',
      animation: 'analytics'
    }
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [AuthGuard],
    data: {
      title: 'Reports',
      breadcrumb: 'Reports',
      animation: 'reports'
    }
  }
];
