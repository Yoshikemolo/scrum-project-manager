import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Project } from './project.entity';
import { ProjectRole } from '@scrum-pm/shared/interfaces';

@Entity('project_members')
@Unique(['project', 'user'])
export class ProjectMember extends BaseEntity {
  @ManyToOne(() => Project, project => project.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ProjectRole,
    default: ProjectRole.TEAM_MEMBER,
  })
  role: ProjectRole;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column('simple-array', { nullable: true })
  permissions?: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  invitedBy?: string;

  @Column({ nullable: true })
  invitationToken?: string;

  @Column({ nullable: true })
  invitationExpires?: Date;
}
