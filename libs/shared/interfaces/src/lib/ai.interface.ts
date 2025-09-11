import { IUser } from './user.interface';
import { IProject } from './project.interface';
import { ISprint } from './sprint.interface';
import { ITask } from './task.interface';

export interface IAIMessage {
  id: string;
  content: string;
  role: AIMessageRole;
  userId?: string;
  projectId?: string;
  context?: IAIContext;
  actions?: IAIAction[];
  timestamp: Date;
  streaming?: boolean;
  tokens?: number;
}

export interface IAIContext {
  project?: IProject;
  sprint?: ISprint;
  task?: ITask;
  user?: IUser;
  history?: IAIMessage[];
  metadata?: Record<string, any>;
}

export interface IAIAction {
  id: string;
  type: AIActionType;
  status: AIActionStatus;
  data: any;
  result?: any;
  error?: string;
  executedAt?: Date;
}

export enum AIMessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  FUNCTION = 'function',
}

export enum AIActionType {
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  ASSIGN_TASK = 'assign_task',
  CREATE_SPRINT = 'create_sprint',
  UPDATE_SPRINT = 'update_sprint',
  ADD_COMMENT = 'add_comment',
  GENERATE_REPORT = 'generate_report',
  ANALYZE_METRICS = 'analyze_metrics',
  SUGGEST_IMPROVEMENTS = 'suggest_improvements',
  PLAN_SPRINT = 'plan_sprint',
  ESTIMATE_TASK = 'estimate_task',
}

export enum AIActionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
  FAILED = 'failed',
}

export interface IAISuggestion {
  id: string;
  type: AISuggestionType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  reasoning?: string;
  actions?: IAIAction[];
  relatedItems?: string[];
  createdAt: Date;
  expiresAt?: Date;
  dismissed?: boolean;
}

export enum AISuggestionType {
  TASK_OPTIMIZATION = 'task_optimization',
  SPRINT_PLANNING = 'sprint_planning',
  RISK_MITIGATION = 'risk_mitigation',
  PROCESS_IMPROVEMENT = 'process_improvement',
  TEAM_COLLABORATION = 'team_collaboration',
  DEADLINE_WARNING = 'deadline_warning',
  CAPACITY_PLANNING = 'capacity_planning',
  QUALITY_IMPROVEMENT = 'quality_improvement',
}

export interface IAIAnalysis {
  id: string;
  type: AIAnalysisType;
  projectId: string;
  sprintId?: string;
  data: any;
  insights: IAIInsight[];
  recommendations: IAIRecommendation[];
  metrics: Record<string, number>;
  confidence: number;
  generatedAt: Date;
}

export enum AIAnalysisType {
  SPRINT_VELOCITY = 'sprint_velocity',
  TEAM_PERFORMANCE = 'team_performance',
  PROJECT_HEALTH = 'project_health',
  RISK_ASSESSMENT = 'risk_assessment',
  BURNDOWN_ANALYSIS = 'burndown_analysis',
  BOTTLENECK_DETECTION = 'bottleneck_detection',
  ESTIMATION_ACCURACY = 'estimation_accuracy',
}

export interface IAIInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  evidence: string[];
  confidence: number;
}

export interface IAIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  expectedImpact: string;
  steps: string[];
  risks?: string[];
}

export interface IAIPrompt {
  id: string;
  name: string;
  type: AIPromptType;
  template: string;
  variables: string[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum AIPromptType {
  TASK_CREATION = 'task_creation',
  SPRINT_PLANNING = 'sprint_planning',
  RETROSPECTIVE = 'retrospective',
  DAILY_STANDUP = 'daily_standup',
  PROJECT_ANALYSIS = 'project_analysis',
  RISK_ASSESSMENT = 'risk_assessment',
  DEEP_THINKING = 'deep_thinking',
  GENERAL_ASSISTANCE = 'general_assistance',
}

export interface IAIConfiguration {
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  streamResponse: boolean;
  enableActions: boolean;
  enableSuggestions: boolean;
  autoApproveActions: boolean;
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  maxContextMessages: number;
}
