import { IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { AIMessageRole } from '@scrum-pm/shared/interfaces';

export class SendAIMessageDto {
  @IsString()
  @MaxLength(4000)
  content: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;
}

export class AIMessageResponseDto {
  id: string;
  content: string;
  role: AIMessageRole;
  projectId?: string;
  sprintId?: string;
  taskId?: string;
  actions?: Array<{
    id: string;
    type: string;
    status: string;
    data: any;
  }>;
  timestamp: Date;
  streaming: boolean;
  tokens?: number;
}

export class AIStreamMessageDto {
  chunk: string;
  index: number;
  isLast: boolean;
  timestamp: Date;
}
