import { IsString, MinLength, MaxLength, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, ProjectVisibility } from '@scrum-pm/shared/interfaces';

class UpdateProjectSettingsDto {
  @IsNumber()
  @IsOptional()
  sprintDuration?: number;

  @IsNumber()
  @IsOptional()
  startDay?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  workingDays?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  storyPointScale?: number[];

  @IsString()
  @IsOptional()
  defaultAssignee?: string;

  @IsBoolean()
  @IsOptional()
  autoAssign?: boolean;

  @IsBoolean()
  @IsOptional()
  requireEstimates?: boolean;

  @IsBoolean()
  @IsOptional()
  allowSubtasks?: boolean;
}

export class UpdateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ValidateNested()
  @Type(() => UpdateProjectSettingsDto)
  @IsOptional()
  settings?: UpdateProjectSettingsDto;
}

export class UpdateProjectResponseDto {
  id: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  settings: UpdateProjectSettingsDto;
  updatedAt: Date;
}

export class ArchiveProjectDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}
