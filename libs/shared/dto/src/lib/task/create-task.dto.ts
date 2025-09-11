import { IsString, MinLength, MaxLength, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString, IsArray } from 'class-validator';
import { TaskType, TaskPriority } from '@scrum-pm/shared/interfaces';
import { IsStoryPoints } from '@scrum-pm/shared/utils';

export class CreateTaskDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsEnum(TaskType)
  type: TaskType;

  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsStoryPoints()
  @IsOptional()
  storyPoints?: number;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

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
}

export class CreateTaskResponseDto {
  id: string;
  key: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  assignee?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  reporter: {
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
  dueDate?: Date;
  labels: string[];
  createdAt: Date;
}
