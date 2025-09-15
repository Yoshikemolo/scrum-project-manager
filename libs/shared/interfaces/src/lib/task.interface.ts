/**
 * Task related interfaces
 */

import { IUser } from './user.interface';
import { IProject } from './project.interface';
import { ISprint } from './sprint.interface';
import { IComment } from './comment.interface';

export interface ITask {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  assignee?: IUser;
  reporter: IUser;
  reviewers?: IUser[];
  watchers?: IUser[];
  project: IProject;
  sprint?: ISprint;
  parentTask?: ITask;
  subtasks?: ITask[];
  dependencies?: ITaskDependency[];
  labels?: string[];
  attachments?: IAttachment[];
  comments?: IComment[];
  customFields?: Record<string, any>;
  position?: number;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: ITaskMetadata;
}

export enum TaskType {
  STORY = 'STORY',
  TASK = 'TASK',
  BUG = 'BUG',
  EPIC = 'EPIC',
  SUBTASK = 'SUBTASK',
  IMPROVEMENT = 'IMPROVEMENT',
  FEATURE = 'FEATURE',
  HOTFIX = 'HOTFIX'
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  TRIVIAL = 'TRIVIAL'
}

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  TESTING = 'TESTING',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  BLOCKED = 'BLOCKED'
}

export interface ITaskDependency {
  id: string;
  type: DependencyType;
  taskId: string;
  dependsOnTaskId: string;
}

export enum DependencyType {
  BLOCKS = 'BLOCKS',
  IS_BLOCKED_BY = 'IS_BLOCKED_BY',
  RELATES_TO = 'RELATES_TO',
  DUPLICATES = 'DUPLICATES',
  IS_DUPLICATED_BY = 'IS_DUPLICATED_BY'
}

export interface IAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: IUser;
  uploadedAt: Date;
  thumbnailUrl?: string;
}

export interface ITaskMetadata {
  blockedReason?: string;
  resolution?: string;
  environment?: string;
  affectedVersion?: string;
  fixVersion?: string;
  components?: string[];
  timeTracking?: ITimeTracking;
  votes?: number;
  watchers?: number;
}

export interface ITimeTracking {
  originalEstimate?: number;
  remainingEstimate?: number;
  timeSpent?: number;
  logs?: ITimeLog[];
}

export interface ITimeLog {
  id: string;
  user: IUser;
  timeSpent: number;
  description?: string;
  date: Date;
  createdAt: Date;
}

export interface ITaskActivity {
  id: string;
  taskId: string;
  user: IUser;
  action: TaskAction;
  field?: string;
  oldValue?: any;
  newValue?: any;
  comment?: string;
  timestamp: Date;
}

export enum TaskAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  UNASSIGNED = 'UNASSIGNED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  ATTACHMENT_REMOVED = 'ATTACHMENT_REMOVED',
  MOVED_TO_SPRINT = 'MOVED_TO_SPRINT',
  REMOVED_FROM_SPRINT = 'REMOVED_FROM_SPRINT',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  STORY_POINTS_CHANGED = 'STORY_POINTS_CHANGED',
  TIME_LOGGED = 'TIME_LOGGED',
  BLOCKED = 'BLOCKED',
  UNBLOCKED = 'UNBLOCKED',
  COMPLETED = 'COMPLETED',
  REOPENED = 'REOPENED'
}

export interface ITaskFilter {
  projectId?: string;
  sprintId?: string;
  assigneeId?: string;
  reporterId?: string;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  type?: TaskType[];
  labels?: string[];
  search?: string;
  includeSubtasks?: boolean;
  includeCompleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ITaskTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  defaultDescription?: string;
  defaultLabels?: string[];
  defaultStoryPoints?: number;
  customFields?: Record<string, any>;
  checklist?: string[];
}

export interface ITaskBulkOperation {
  taskIds: string[];
  operation: BulkOperation;
  value?: any;
}

export enum BulkOperation {
  UPDATE_STATUS = 'UPDATE_STATUS',
  UPDATE_PRIORITY = 'UPDATE_PRIORITY',
  UPDATE_ASSIGNEE = 'UPDATE_ASSIGNEE',
  ADD_LABEL = 'ADD_LABEL',
  REMOVE_LABEL = 'REMOVE_LABEL',
  MOVE_TO_SPRINT = 'MOVE_TO_SPRINT',
  REMOVE_FROM_SPRINT = 'REMOVE_FROM_SPRINT',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE'
}
