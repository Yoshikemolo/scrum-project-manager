/**
 * Project related interfaces
 */

import { IUser } from './user.interface';
import { ISprint } from './sprint.interface';
import { ITask } from './task.interface';

export interface IProject {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color?: string;
  owner: IUser;
  members: IProjectMember[];
  sprints: ISprint[];
  backlog: ITask[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  category?: string;
  tags?: string[];
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  settings: IProjectSettings;
  metrics?: IProjectMetrics;
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export interface IProjectMember {
  user: IUser;
  role: ProjectRole;
  permissions: string[];
  joinedAt: Date;
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED'
}

export enum ProjectVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  TEAM = 'TEAM',
  ORGANIZATION = 'ORGANIZATION'
}

export enum ProjectRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export interface IProjectSettings {
  workingDays: number[];
  sprintDuration: number;
  storyPointScale: number[];
  taskTypes: ITaskType[];
  taskStatuses: ITaskStatus[];
  priorities: IPriority[];
  labels: ILabel[];
  customFields: ICustomField[];
  automations: IAutomation[];
  integrations: IIntegration[];
}

export interface ITaskType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface ITaskStatus {
  id: string;
  name: string;
  category: 'TODO' | 'IN_PROGRESS' | 'DONE';
  color: string;
  order: number;
}

export interface IPriority {
  id: string;
  name: string;
  level: number;
  icon: string;
  color: string;
}

export interface ILabel {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface ICustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'user';
  required: boolean;
  options?: string[];
  defaultValue?: any;
}

export interface IAutomation {
  id: string;
  name: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: Record<string, any>[];
  enabled: boolean;
}

export interface IIntegration {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export interface IProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  velocity: number;
  burndownData: IBurndownPoint[];
  teamPerformance: ITeamPerformance[];
  sprintProgress: number;
  projectProgress: number;
  averageCycleTime: number;
  averageLeadTime: number;
}

export interface IBurndownPoint {
  date: Date;
  ideal: number;
  actual: number;
  projected?: number;
}

export interface ITeamPerformance {
  userId: string;
  completedTasks: number;
  completedStoryPoints: number;
  averageVelocity: number;
  efficiency: number;
}

export interface IProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
  settings: Partial<IProjectSettings>;
  sampleData?: {
    sprints?: Partial<ISprint>[];
    tasks?: Partial<ITask>[];
  };
}

export interface IProjectInvite {
  id: string;
  projectId: string;
  email: string;
  role: ProjectRole;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdBy: IUser;
  createdAt: Date;
}
