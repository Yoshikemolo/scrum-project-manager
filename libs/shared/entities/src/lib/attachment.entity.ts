import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { User } from './user.entity';

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number;

  @Column()
  url: string;

  @Column()
  path: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: User;

  @ManyToOne(() => Task, task => task.attachments, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @ManyToOne(() => Comment, comment => comment.attachments, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
    pages?: number;
  };
}
