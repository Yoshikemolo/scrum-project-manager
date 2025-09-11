import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isSystem: boolean;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id' },
    inverseJoinColumn: { name: 'permission_id' },
  })
  permissions: Permission[];
}
