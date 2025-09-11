import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ProjectMember } from './project-member.entity';
import { Sprint } from './sprint.entity';
import { Task } from './task.entity';
import { ProjectStatus, ProjectVisibility } from '@scrum-pm/shared/interfaces';

@Entity('projects')
export class Project extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  key: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.ACTIVE,
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectVisibility,
    default: ProjectVisibility.PRIVATE,
  })
  visibility: ProjectVisibility;

  @ManyToOne(() => User, user => user.ownedProjects)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => ProjectMember, member => member.project, { cascade: true })
  members: ProjectMember[];

  @OneToMany(() => Sprint, sprint => sprint.project)
  sprints: Sprint[];

  @OneToMany(() => Task, task => task.project)
  tasks: Task[];

  @Column('jsonb', { default: {} })
  settings: {
    sprintDuration: number;
    startDay: number;
    workingDays: number[];
    storyPointScale: number[];
    defaultAssignee?: string;
    autoAssign: boolean;
    requireEstimates: boolean;
    allowSubtasks: boolean;
    customFields: Array<{
      id: string;
      name: string;
      type: string;
      required: boolean;
      options?: string[];
      defaultValue?: any;
    }>;
  };

  @Column('jsonb', { default: {} })
  metrics: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    averageVelocity: number;
    currentVelocity: number;
    sprintProgress: number;
  };

  @Column({ nullable: true })
  archivedAt?: Date;

  @Column({ nullable: true })
  archivedBy?: string;

  @Column({ nullable: true, type: 'text' })
  archiveReason?: string;

  @Column({ default: 0 })
  taskCounter: number;
}
