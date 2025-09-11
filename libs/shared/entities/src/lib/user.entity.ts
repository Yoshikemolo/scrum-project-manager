import { Entity, Column, OneToMany, ManyToMany, JoinTable, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';
import { Group } from './group.entity';
import { Project } from './project.entity';
import { Task } from './task.entity';
import { Comment } from './comment.entity';
import { CryptoUtils } from '@scrum-pm/shared/utils';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpires?: Date;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column('jsonb', { default: {} })
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      inApp: boolean;
      dailyDigest: boolean;
      weeklyReport: boolean;
    };
    displaySettings: {
      compactView: boolean;
      showAvatars: boolean;
      animationsEnabled: boolean;
      sidebarCollapsed: boolean;
    };
  };

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles: Role[];

  @ManyToMany(() => Group, group => group.members)
  groups: Group[];

  @OneToMany(() => Project, project => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => Task, task => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, task => task.reporter)
  reportedTasks: Task[];

  @OneToMany(() => Comment, comment => comment.author)
  comments: Comment[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await CryptoUtils.hashPassword(this.password);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return CryptoUtils.verifyPassword(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some(role => role.name === roleName) || false;
  }

  hasPermission(permission: string): boolean {
    return this.roles?.some(role => 
      role.permissions?.some(perm => perm.name === permission)
    ) || false;
  }
}
