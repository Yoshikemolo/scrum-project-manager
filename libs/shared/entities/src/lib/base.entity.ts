import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, VersionColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @VersionColumn()
  version: number;
}

export abstract class AuditableEntity extends BaseEntity {
  createdBy: string;
  updatedBy?: string;
}
