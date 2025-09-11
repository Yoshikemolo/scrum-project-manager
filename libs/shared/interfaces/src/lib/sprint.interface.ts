import { IProject } from './project.interface';
import { ITask } from './task.interface';
import { IUser } from './user.interface';

export interface ISprint {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  project: IProject;
  tasks: ITask[];
  status: SprintStatus;
  velocity: number;
  plannedVelocity: number;
  completedStoryPoints: number;
  totalStoryPoints: number;
  burndownData: IBurndownData[];
  retrospective?: IRetrospective;
  createdBy: IUser;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IBurndownData {
  date: Date;
  remainingPoints: number;
  completedPoints: number;
  idealPoints: number;
  addedPoints: number;
  removedPoints: number;
}

export interface IRetrospective {
  id: string;
  sprintId: string;
  whatWentWell: IRetrospectiveItem[];
  whatWentWrong: IRetrospectiveItem[];
  actionItems: IActionItem[];
  teamMood: number; // 1-5 scale
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRetrospectiveItem {
  id: string;
  content: string;
  author: IUser;
  votes: number;
  category?: string;
  createdAt: Date;
}

export interface IActionItem {
  id: string;
  title: string;
  description?: string;
  assignee?: IUser;
  dueDate?: Date;
  status: ActionItemStatus;
  createdAt: Date;
  completedAt?: Date;
}

export enum SprintStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ActionItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface ICreateSprintRequest {
  name: string;
  projectId: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
}

export interface IUpdateSprintRequest {
  name?: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status?: SprintStatus;
}

export interface ISprintPlanning {
  sprintId: string;
  availableCapacity: number;
  plannedCapacity: number;
  teamMembers: ISprintTeamMember[];
  selectedTasks: string[];
  risks: ISprintRisk[];
  dependencies: ISprintDependency[];
}

export interface ISprintTeamMember {
  userId: string;
  capacity: number; // hours available
  plannedHours: number;
  assignedTasks: string[];
}

export interface ISprintRisk {
  id: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface ISprintDependency {
  id: string;
  taskId: string;
  dependsOn: string;
  type: 'blocks' | 'requires';
}
