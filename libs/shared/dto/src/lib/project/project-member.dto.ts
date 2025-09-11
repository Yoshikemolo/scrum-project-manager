import { IsEmail, IsEnum, IsArray, IsString, IsOptional, IsUUID } from 'class-validator';
import { ProjectRole } from '@scrum-pm/shared/interfaces';

export class AddProjectMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class UpdateProjectMemberDto {
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}

export class RemoveProjectMemberDto {
  @IsUUID()
  userId: string;
}

export class ProjectMemberResponseDto {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  role: ProjectRole;
  permissions: string[];
  joinedAt: Date;
}

export class InviteProjectMemberDto {
  @IsEmail({}, { each: true })
  emails: string[];

  @IsEnum(ProjectRole)
  role: ProjectRole;

  @IsString()
  @IsOptional()
  message?: string;
}
