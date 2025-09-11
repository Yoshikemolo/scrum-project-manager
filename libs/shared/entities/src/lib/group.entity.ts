import { Entity, Column, ManyToOne, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('groups')
export class Group extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @ManyToMany(() => User, user => user.groups)
  @JoinTable({
    name: 'group_members',
    joinColumn: { name: 'group_id' },
    inverseJoinColumn: { name: 'user_id' },
  })
  members: User[];

  @Column('jsonb', { default: {} })
  settings: {
    visibility: 'public' | 'private';
    joinApproval: boolean;
    allowInvites: boolean;
  };
}
