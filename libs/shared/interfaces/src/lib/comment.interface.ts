/**
 * Comment related interfaces
 */

import { IUser } from './user.interface';
import { ITask } from './task.interface';

export interface IComment {
  id: string;
  content: string;
  author: IUser;
  taskId?: string;
  task?: ITask;
  parentId?: string;
  parent?: IComment;
  replies?: IComment[];
  mentions?: IUser[];
  attachments?: ICommentAttachment[];
  reactions?: IReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentAttachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
}

export interface IReaction {
  id: string;
  emoji: string;
  user: IUser;
  createdAt: Date;
}

export interface ICommentThread {
  id: string;
  taskId: string;
  comments: IComment[];
  participantIds: string[];
  isResolved: boolean;
  resolvedBy?: IUser;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentDraft {
  id: string;
  taskId: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommentNotification {
  id: string;
  commentId: string;
  comment: IComment;
  userId: string;
  type: CommentNotificationType;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export enum CommentNotificationType {
  MENTION = 'MENTION',
  REPLY = 'REPLY',
  TASK_COMMENT = 'TASK_COMMENT',
  REACTION = 'REACTION'
}
