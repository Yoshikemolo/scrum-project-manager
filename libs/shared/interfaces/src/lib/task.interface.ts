import { IUser } from './user.interface';
import { IProject } from './project.interface';
import { ISprint } from './sprint.interface';

export interface ITask {
  id: string;
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
  project: IProject;
  sprint?: ISprint;
  parent?: ITask;
  subtasks: ITask[];
  dependencies: ITaskDependency[];
  comments: IComment[];
  attachments: IAttachment[];
  labels: string[];
  customFields?: Record<string, any>;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  blockedReason?: string;
  resolution?: string;
}

export interface ITaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: DependencyType;
}

export interface IComment {
  id: string;
  content: string;
  author: IUser;
  taskId: string;
  parentId?: string;
  mentions: string[];
  attachments: IAttachment[];
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedBy: IUser;
  uploadedAt: Date;
}

export enum TaskType {
  STORY = 'story',
  BUG = 'bug',
  TASK = 'task',
  EPIC = 'epic',
  SUBTASK = 'subtask',
  SPIKE = 'spike',
}

export enum TaskPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  TRIVIAL = 'trivial',
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  TESTING = 'testing',
  DONE = 'done',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked',
}

export enum DependencyType {
  BLOCKS = 'blocks',
  IS_BLOCKED_BY = 'is_blocked_by',
  RELATES_TO = 'relates_to',
  DUPLICATES = 'duplicates',
  CLONES = 'clones',
}

export interface ICreateTaskRequest {
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  sprintId?: string;
  parentId?: string;
  storyPoints?: number;
  estimatedHours?: number;
  dueDate?: Date;
  labels?: string[];
}

export interface IUpdateTaskRequest {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigneeId?: string;
  sprintId?: string;
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  labels?: string[];
  position?: number;
}

export interface IMoveTaskRequest {
  taskId: string;
  targetStatus: TaskStatus;
  targetSprintId?: string;
  position: number;
}

export interface ITaskFilter {
  projectId?: string;
  sprintId?: string;
  status?: TaskStatus[];
  type?: TaskType[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  reporterId?: string;
  labels?: string[];
  search?: string;
  hasAttachments?: boolean;
  isBlocked?: boolean;
  isOverdue?: boolean;
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
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  COMMENTED = 'commented',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  MOVED_TO_SPRINT = 'moved_to_sprint',
  REMOVED_FROM_SPRINT = 'removed_from_sprint',
  BLOCKED = 'blocked',
  UNBLOCKED = 'unblocked',
  COMPLETED = 'completed',
}
