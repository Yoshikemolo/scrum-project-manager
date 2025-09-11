import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Task } from './task.entity';
import { User } from './user.entity';
import { Attachment } from './attachment.entity';

@Entity('comments')
export class Comment extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Task, task => task.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @ManyToOne(() => Comment, comment => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  replies: Comment[];

  @OneToMany(() => Attachment, attachment => attachment.comment, { cascade: true })
  attachments: Attachment[];

  @Column('simple-array', { default: '' })
  mentions: string[];

  @Column({ default: false })
  edited: boolean;

  @Column({ nullable: true })
  editedAt?: Date;

  @Column({ nullable: true })
  editedBy?: string;

  @Column('jsonb', { default: [] })
  reactions: Array<{
    userId: string;
    emoji: string;
    timestamp: Date;
  }>;
}
