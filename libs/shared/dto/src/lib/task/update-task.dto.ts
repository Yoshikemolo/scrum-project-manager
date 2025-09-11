import { IsString, MinLength, MaxLength, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString, IsArray } from 'class-validator';
import { TaskType, TaskPriority, TaskStatus } from '@scrum-pm/shared/interfaces';
import { IsStoryPoints } from '@scrum-pm/shared/utils';

export class UpdateTaskDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsNumber()
  @IsStoryPoints()
  @IsOptional()
  storyPoints?: number;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsNumber()
  @IsOptional()
  actualHours?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  labels?: string[];

  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  blockedReason?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  resolution?: string;
}

export class UpdateTaskResponseDto {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  sprint?: {
    id: string;
    name: string;
  };
  storyPoints?: number;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  labels: string[];
  position: number;
  blockedReason?: string;
  resolution?: string;
  updatedAt: Date;
}
