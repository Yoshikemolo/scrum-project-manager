import { IsString, MinLength, MaxLength, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SprintStatus } from '@scrum-pm/shared/interfaces';

export class UpdateSprintDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;
}

export class UpdateSprintResponseDto {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: SprintStatus;
  velocity: number;
  plannedVelocity: number;
  completedStoryPoints: number;
  totalStoryPoints: number;
  updatedAt: Date;
}

export class StartSprintDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  taskIds?: string[];
}

export class CompleteSprintDto {
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  moveIncompleteTasks?: boolean;

  @IsUUID()
  @IsOptional()
  targetSprintId?: string;
}
