import { IUser } from './user.interface';
import { ISprint } from './sprint.interface';
import { ITask } from './task.interface';

export interface IProject {
  id: string;
  name: string;
  key: string;
  description?: string;
  owner: IUser;
  members: IProjectMember[];
  sprints: ISprint[];
  backlog: ITask[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  settings: IProjectSettings;
  metrics: IProjectMetrics;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface IProjectMember {
  user: IUser;
  role: ProjectRole;
  joinedAt: Date;
  permissions: string[];
}

export interface IProjectSettings {
  sprintDuration: number; // in days
  startDay: number; // 0-6 (Sunday-Saturday)
  workingDays: number[];
  storyPointScale: number[];
  defaultAssignee?: string;
  autoAssign: boolean;
  requireEstimates: boolean;
  allowSubtasks: boolean;
  customFields: ICustomField[];
}

export interface ICustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface IProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  averageVelocity: number;
  currentVelocity: number;
  sprintProgress: number;
  burndownData: IBurndownPoint[];
  velocityTrend: IVelocityPoint[];
  teamPerformance: ITeamPerformance[];
}

export interface IBurndownPoint {
  date: Date;
  ideal: number;
  actual: number;
  completed: number;
}

export interface IVelocityPoint {
  sprint: string;
  planned: number;
  completed: number;
  date: Date;
}

export interface ITeamPerformance {
  userId: string;
  userName: string;
  tasksCompleted: number;
  storyPointsCompleted: number;
  averageCompletionTime: number;
  efficiency: number;
}

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  CANCELLED = 'cancelled',
}

export enum ProjectVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  TEAM = 'team',
  ORGANIZATION = 'organization',
}

export enum ProjectRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  TESTER = 'tester',
  DESIGNER = 'designer',
  VIEWER = 'viewer',
}

export interface ICreateProjectRequest {
  name: string;
  key: string;
  description?: string;
  visibility: ProjectVisibility;
  settings?: Partial<IProjectSettings>;
}

export interface IUpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  settings?: Partial<IProjectSettings>;
}

export interface IProjectSubscription {
  id: string;
  userId: string;
  projectId: string;
  events: ProjectEventType[];
  createdAt: Date;
}

export enum ProjectEventType {
  TASK_CREATED = 'task_created',
  TASK_UPDATED = 'task_updated',
  TASK_COMPLETED = 'task_completed',
  SPRINT_STARTED = 'sprint_started',
  SPRINT_COMPLETED = 'sprint_completed',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  PROJECT_UPDATED = 'project_updated',
}
