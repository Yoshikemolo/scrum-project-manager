import { IsUUID, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { TaskStatus } from '@scrum-pm/shared/interfaces';

export class MoveTaskDto {
  @IsEnum(TaskStatus)
  targetStatus: TaskStatus;

  @IsUUID()
  @IsOptional()
  targetSprintId?: string;

  @IsNumber()
  position: number;
}

export class MoveTaskResponseDto {
  id: string;
  key: string;
  title: string;
  status: TaskStatus;
  sprint?: {
    id: string;
    name: string;
  };
  position: number;
  updatedAt: Date;
}

export class AssignTaskDto {
  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}

export class BulkMoveTasksDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];

  @IsEnum(TaskStatus)
  @IsOptional()
  targetStatus?: TaskStatus;

  @IsUUID()
  @IsOptional()
  targetSprintId?: string;
}

export class BulkAssignTasksDto {
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];

  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
