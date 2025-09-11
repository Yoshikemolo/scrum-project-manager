/**
 * Sprint related interfaces
 */

import { IUser } from './user.interface';
import { IProject } from './project.interface';
import { ITask } from './task.interface';

export interface ISprint {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  project: IProject;
  tasks: ITask[];
  status: SprintStatus;
  velocity?: number;
  capacity?: number;
  completedStoryPoints?: number;
  totalStoryPoints?: number;
  createdBy: IUser;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  retrospective?: IRetrospective;
  metrics?: ISprintMetrics;
}

export enum SprintStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ISprintMetrics {
  plannedStoryPoints: number;
  completedStoryPoints: number;
  addedStoryPoints: number;
  removedStoryPoints: number;
  velocity: number;
  predictability: number;
  burndownData: IBurndownData[];
  taskDistribution: ITaskDistribution;
  teamCapacity: ITeamCapacity[];
  dailyProgress: IDailyProgress[];
}

export interface IBurndownData {
  date: Date;
  idealPoints: number;
  actualPoints: number;
  remainingPoints: number;
  completedPoints: number;
  addedPoints?: number;
  removedPoints?: number;
}

export interface ITaskDistribution {
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  blocked: number;
}

export interface ITeamCapacity {
  userId: string;
  user: IUser;
  capacity: number; // hours
  allocated: number; // hours
  available: number; // hours
  utilization: number; // percentage
}

export interface IDailyProgress {
  date: Date;
  completedTasks: number;
  completedStoryPoints: number;
  addedTasks: number;
  blockedTasks: number;
}

export interface IRetrospective {
  id: string;
  sprintId: string;
  facilitator: IUser;
  participants: IUser[];
  date: Date;
  whatWentWell: IRetrospectiveItem[];
  whatWentWrong: IRetrospectiveItem[];
  actionItems: IActionItem[];
  notes?: string;
  mood?: number; // 1-5 scale
  createdAt: Date;
  updatedAt: Date;
}

export interface IRetrospectiveItem {
  id: string;
  text: string;
  category?: string;
  votes: number;
  createdBy: IUser;
  createdAt: Date;
}

export interface IActionItem {
  id: string;
  title: string;
  description?: string;
  assignee?: IUser;
  dueDate?: Date;
  status: ActionItemStatus;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: Date;
  completedAt?: Date;
}

export enum ActionItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ISprintPlanning {
  id: string;
  sprintId: string;
  plannedTasks: ITask[];
  totalStoryPoints: number;
  teamCapacity: number;
  risks: IRisk[];
  dependencies: IDependency[];
  notes?: string;
  approvedBy?: IUser;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRisk {
  id: string;
  title: string;
  description: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  probability: 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation?: string;
  owner?: IUser;
}

export interface IDependency {
  id: string;
  title: string;
  description: string;
  type: 'INTERNAL' | 'EXTERNAL';
  status: 'RESOLVED' | 'PENDING' | 'BLOCKED';
  owner?: IUser;
  dueDate?: Date;
}

export interface ISprintReview {
  id: string;
  sprintId: string;
  date: Date;
  attendees: IUser[];
  demonstratedFeatures: IDemonstratedFeature[];
  feedback: IFeedback[];
  decisions: IDecision[];
  nextSteps?: string;
  recording?: string; // URL to recording
  createdAt: Date;
  updatedAt: Date;
}

export interface IDemonstratedFeature {
  id: string;
  taskId: string;
  task: ITask;
  demonstratedBy: IUser;
  status: 'ACCEPTED' | 'REJECTED' | 'NEEDS_WORK';
  feedback?: string;
}

export interface IFeedback {
  id: string;
  text: string;
  type: 'POSITIVE' | 'NEGATIVE' | 'SUGGESTION';
  givenBy: IUser;
  createdAt: Date;
}

export interface IDecision {
  id: string;
  title: string;
  description: string;
  madeBy: IUser;
  createdAt: Date;
}
