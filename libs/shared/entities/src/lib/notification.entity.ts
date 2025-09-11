import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationType } from '@scrum-pm/shared/interfaces';

@Entity('notifications')
export class Notification extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column('jsonb', { nullable: true })
  data?: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @Column({ nullable: true })
  readAt?: Date;

  @Column({ nullable: true })
  emailSent?: boolean;

  @Column({ nullable: true })
  emailSentAt?: Date;

  @Column({ nullable: true })
  pushSent?: boolean;

  @Column({ nullable: true })
  pushSentAt?: Date;

  @Column({ nullable: true })
  actionUrl?: string;

  @Column({ nullable: true })
  actionLabel?: string;

  @Column({ nullable: true })
  expiresAt?: Date;
}
