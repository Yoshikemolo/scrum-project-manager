import { IsString, MinLength, MaxLength, IsOptional, IsEnum, ValidateNested, IsArray, IsNumber, IsBoolean, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectVisibility } from '@scrum-pm/shared/interfaces';
import { IsProjectKey } from '@scrum-pm/shared/utils';

class ProjectSettingsDto {
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

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsProjectKey()
  key: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsEnum(ProjectVisibility)
  @IsOptional()
  visibility?: ProjectVisibility;

  @ValidateNested()
  @Type(() => ProjectSettingsDto)
  @IsOptional()
  settings?: ProjectSettingsDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  memberEmails?: string[];
}

export class CreateProjectResponseDto {
  id: string;
  name: string;
  key: string;
  description?: string;
  visibility: ProjectVisibility;
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  settings: ProjectSettingsDto;
  createdAt: Date;
}
