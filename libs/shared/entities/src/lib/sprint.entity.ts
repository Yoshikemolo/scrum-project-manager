import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { User } from './user.entity';
import { SprintStatus } from '@scrum-pm/shared/interfaces';

@Entity('sprints')
export class Sprint extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  goal?: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SprintStatus,
    default: SprintStatus.PLANNING,
  })
  status: SprintStatus;

  @ManyToOne(() => Project, project => project.sprints, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => Task, task => task.sprint)
  tasks: Task[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ default: 0 })
  velocity: number;

  @Column({ default: 0 })
  plannedVelocity: number;

  @Column({ default: 0 })
  completedStoryPoints: number;

  @Column({ default: 0 })
  totalStoryPoints: number;

  @Column('jsonb', { default: [] })
  burndownData: Array<{
    date: Date;
    remainingPoints: number;
    completedPoints: number;
    idealPoints: number;
    addedPoints: number;
    removedPoints: number;
  }>;

  @Column('jsonb', { nullable: true })
  retrospective?: {
    whatWentWell: Array<{
      id: string;
      content: string;
      authorId: string;
      votes: number;
      category?: string;
      createdAt: Date;
    }>;
    whatWentWrong: Array<{
      id: string;
      content: string;
      authorId: string;
      votes: number;
      category?: string;
      createdAt: Date;
    }>;
    actionItems: Array<{
      id: string;
      title: string;
      description?: string;
      assigneeId?: string;
      dueDate?: Date;
      status: string;
      createdAt: Date;
      completedAt?: Date;
    }>;
    teamMood: number;
    notes?: string;
  };

  @Column({ nullable: true })
  startedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ nullable: true })
  cancelledAt?: Date;

  @Column({ nullable: true, type: 'text' })
  cancellationReason?: string;
}
