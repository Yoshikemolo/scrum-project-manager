/**
 * Root store configuration for the application.
 * Combines all feature reducers and provides the app state interface.
 */

import { ActionReducerMap, MetaReducer, createFeatureSelector } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { environment } from '../../environments/environment';

import * as fromAuth from './auth/auth.reducer';
import * as fromProjects from './projects/projects.reducer';
import * as fromSprints from './sprints/sprints.reducer';
import * as fromTasks from './tasks/tasks.reducer';
import * as fromNotifications from './notifications/notifications.reducer';
import * as fromUI from './ui/ui.reducer';
import * as fromSettings from './settings/settings.reducer';

import { AuthEffects } from './auth/auth.effects';
import { ProjectsEffects } from './projects/projects.effects';
import { SprintsEffects } from './sprints/sprints.effects';
import { TasksEffects } from './tasks/tasks.effects';
import { NotificationsEffects } from './notifications/notifications.effects';
import { SettingsEffects } from './settings/settings.effects';

/**
 * Root application state interface
 */
export interface AppState {
  router: RouterReducerState;
  auth: fromAuth.AuthState;
  projects: fromProjects.ProjectsState;
  sprints: fromSprints.SprintsState;
  tasks: fromTasks.TasksState;
  notifications: fromNotifications.NotificationsState;
  ui: fromUI.UIState;
  settings: fromSettings.SettingsState;
}

/**
 * Root reducers map
 */
export const reducers: ActionReducerMap<AppState> = {
  router: routerReducer,
  auth: fromAuth.authReducer,
  projects: fromProjects.projectsReducer,
  sprints: fromSprints.sprintsReducer,
  tasks: fromTasks.tasksReducer,
  notifications: fromNotifications.notificationsReducer,
  ui: fromUI.uiReducer,
  settings: fromSettings.settingsReducer
};

/**
 * Meta reducers for development and production
 */
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [logger]
  : [];

/**
 * Logger meta reducer for development
 */
function logger(reducer: any): any {
  return (state: any, action: any) => {
    const result = reducer(state, action);
    console.groupCollapsed(action.type);
    console.log('prev state', state);
    console.log('action', action);
    console.log('next state', result);
    console.groupEnd();
    return result;
  };
}

/**
 * All effects to be registered
 */
export const effects = [
  AuthEffects,
  ProjectsEffects,
  SprintsEffects,
  TasksEffects,
  NotificationsEffects,
  SettingsEffects
];

/**
 * Feature selectors
 */
export const selectRouterState = createFeatureSelector<RouterReducerState>('router');
export const selectAuthState = createFeatureSelector<fromAuth.AuthState>('auth');
export const selectProjectsState = createFeatureSelector<fromProjects.ProjectsState>('projects');
export const selectSprintsState = createFeatureSelector<fromSprints.SprintsState>('sprints');
export const selectTasksState = createFeatureSelector<fromTasks.TasksState>('tasks');
export const selectNotificationsState = createFeatureSelector<fromNotifications.NotificationsState>('notifications');
export const selectUIState = createFeatureSelector<fromUI.UIState>('ui');
export const selectSettingsState = createFeatureSelector<fromSettings.SettingsState>('settings');
