import { IsUUID, IsArray, IsNumber, ValidateNested, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class SprintTeamMemberDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  capacity: number;

  @IsNumber()
  plannedHours: number;

  @IsArray()
  @IsUUID('4', { each: true })
  assignedTasks: string[];
}

class SprintRiskDto {
  @IsString()
  description: string;

  @IsEnum(['low', 'medium', 'high'])
  impact: 'low' | 'medium' | 'high';

  @IsEnum(['low', 'medium', 'high'])
  probability: 'low' | 'medium' | 'high';

  @IsString()
  @IsOptional()
  mitigation?: string;
}

class SprintDependencyDto {
  @IsUUID()
  taskId: string;

  @IsUUID()
  dependsOn: string;

  @IsEnum(['blocks', 'requires'])
  type: 'blocks' | 'requires';
}

export class UpdateSprintPlanningDto {
  @IsNumber()
  @IsOptional()
  availableCapacity?: number;

  @IsNumber()
  @IsOptional()
  plannedCapacity?: number;

  @ValidateNested({ each: true })
  @Type(() => SprintTeamMemberDto)
  @IsOptional()
  teamMembers?: SprintTeamMemberDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  selectedTasks?: string[];

  @ValidateNested({ each: true })
  @Type(() => SprintRiskDto)
  @IsOptional()
  risks?: SprintRiskDto[];

  @ValidateNested({ each: true })
  @Type(() => SprintDependencyDto)
  @IsOptional()
  dependencies?: SprintDependencyDto[];
}

export class SprintPlanningResponseDto {
  sprintId: string;
  availableCapacity: number;
  plannedCapacity: number;
  teamMembers: SprintTeamMemberDto[];
  selectedTasks: string[];
  risks: SprintRiskDto[];
  dependencies: SprintDependencyDto[];
  updatedAt: Date;
}
