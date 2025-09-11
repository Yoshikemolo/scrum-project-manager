import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Sprint } from './sprint.entity';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Attachment } from './attachment.entity';
import { TaskType, TaskPriority, TaskStatus } from '@scrum-pm/shared/interfaces';

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ unique: true })
  key: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.TASK,
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({ nullable: true })
  storyPoints?: number;

  @Column({ nullable: true })
  estimatedHours?: number;

  @Column({ nullable: true })
  actualHours?: number;

  @ManyToOne(() => User, user => user.assignedTasks, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;

  @ManyToOne(() => User, user => user.reportedTasks)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Sprint, sprint => sprint.tasks, { nullable: true })
  @JoinColumn({ name: 'sprint_id' })
  sprint?: Sprint;

  @ManyToOne(() => Task, task => task.subtasks, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Task;

  @OneToMany(() => Task, task => task.parent)
  subtasks: Task[];

  @OneToMany(() => Comment, comment => comment.task, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Attachment, attachment => attachment.task, { cascade: true })
  attachments: Attachment[];

  @Column('simple-array', { default: '' })
  labels: string[];

  @Column('jsonb', { nullable: true })
  customFields?: Record<string, any>;

  @Column({ default: 0 })
  position: number;

  @Column({ nullable: true })
  dueDate?: Date;

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ nullable: true, type: 'text' })
  blockedReason?: string;

  @Column({ nullable: true, type: 'text' })
  resolution?: string;

  @Column('jsonb', { default: [] })
  dependencies: Array<{
    taskId: string;
    type: 'blocks' | 'is_blocked_by' | 'relates_to';
  }>;

  @Column('jsonb', { default: [] })
  watchers: string[];

  @Column('jsonb', { default: [] })
  activity: Array<{
    id: string;
    userId: string;
    action: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
    comment?: string;
    timestamp: Date;
  }>;
}
