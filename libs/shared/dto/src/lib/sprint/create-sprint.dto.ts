import { IsString, MinLength, MaxLength, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { IsFutureDate, IsDateRange } from '@scrum-pm/shared/utils';

export class CreateSprintDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsUUID()
  projectId: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsFutureDate()
  startDate: Date;

  @IsDateString()
  @IsFutureDate()
  @IsDateRange('startDate')
  endDate: Date;
}

export class CreateSprintResponseDto {
  id: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: string;
  project: {
    id: string;
    name: string;
    key: string;
  };
  createdBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: Date;
}
