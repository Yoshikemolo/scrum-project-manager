import { Entity, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  conditions?: Record<string, any>;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];
}
