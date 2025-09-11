import { IsUUID, IsEnum, IsOptional, IsObject } from 'class-validator';
import { AIActionStatus } from '@scrum-pm/shared/interfaces';

export class ExecuteAIActionDto {
  @IsUUID()
  actionId: string;

  @IsEnum(AIActionStatus)
  @IsOptional()
  status?: AIActionStatus;

  @IsObject()
  @IsOptional()
  modifications?: Record<string, any>;
}

export class AIActionResponseDto {
  id: string;
  type: string;
  status: AIActionStatus;
  data: any;
  result?: any;
  error?: string;
  executedAt?: Date;
}

export class GetAISuggestionsDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsEnum(['task_optimization', 'sprint_planning', 'risk_mitigation', 'process_improvement'])
  @IsOptional()
  type?: string;
}

export class AISuggestionResponseDto {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  reasoning?: string;
  actions?: AIActionResponseDto[];
  relatedItems?: string[];
  createdAt: Date;
  expiresAt?: Date;
}
