import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('activities')
@Index(['entityType', 'entityId'])
@Index(['userId', 'timestamp'])
export class Activity extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true, type: 'text' })
  userAgent?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ nullable: true })
  projectId?: string;

  @Column({ nullable: true })
  description?: string;
}
