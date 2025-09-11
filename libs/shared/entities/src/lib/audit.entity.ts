import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('audit_logs')
@Index(['userId', 'timestamp'])
@Index(['entityType', 'entityId'])
@Index(['action', 'timestamp'])
export class AuditLog extends BaseEntity {
  @Column()
  userId: string;

  @Column()
  userName: string;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column('jsonb', { nullable: true })
  oldValue?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newValue?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true, type: 'text' })
  userAgent?: string;

  @Column({ nullable: true })
  requestId?: string;

  @Column({ nullable: true })
  sessionId?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ default: true })
  success: boolean;

  @Column({ nullable: true, type: 'text' })
  errorMessage?: string;

  @Column({ nullable: true })
  duration?: number;
}
