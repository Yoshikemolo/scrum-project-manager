# AI Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [ChatGPT-5 Integration](#chatgpt-5-integration)
4. [System Prompts](#system-prompts)
5. [AI Features](#ai-features)
6. [API Endpoints](#api-endpoints)
7. [Context Management](#context-management)
8. [Security Considerations](#security-considerations)
9. [Usage Examples](#usage-examples)
10. [Related Documentation](#related-documentation)

## Overview

The AI Assistant Service integrates ChatGPT-5 to provide intelligent assistance for project management tasks. The service includes:

- Natural language understanding
- Context-aware suggestions
- Automated task creation
- Methodology compliance checking
- Deep thinking mode for complex queries
- Proactive assistance based on project state

## Architecture

### Service Architecture

```
┌─────────────────┐
│    Frontend     │
│   (Chat UI)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│   (GraphQL)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Assistant   │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI API     │
│  (ChatGPT-5)    │
└─────────────────┘
```

### Components

- **Chat Interface**: React component in frontend
- **WebSocket Handler**: Real-time communication
- **Context Builder**: Constructs prompts with context
- **Action Executor**: Performs requested actions
- **Prompt Manager**: Manages system prompts

## ChatGPT-5 Integration

### Configuration

```typescript
// ai-assistant.config.ts
export const AI_CONFIG = {
  model: 'gpt-5-turbo',
  maxTokens: 4000,
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5,
  streamResponse: true,
};
```

### API Client

```typescript
// openai.service.ts
import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const completion = await this.openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: AI_CONFIG.streamResponse,
    });

    return completion;
  }
}
```

## System Prompts

### Base System Prompt

```typescript
const BASE_SYSTEM_PROMPT = `
You are an expert SCRUM project management assistant integrated into a project management platform.

Your capabilities include:
- Providing guidance on SCRUM methodology
- Helping with sprint planning and task estimation
- Analyzing project metrics and suggesting improvements
- Creating and updating tasks, sprints, and projects
- Answering questions about project status

Always:
- Be concise and actionable
- Follow SCRUM best practices
- Suggest concrete improvements
- Respect user permissions and data privacy
`;
```

### Context-Aware Prompts

```typescript
const SPRINT_PLANNING_PROMPT = `
Context: User is planning a sprint.
Current sprint velocity: {velocity}
Backlog items: {backlogCount}

Help the user:
1. Select appropriate stories for the sprint
2. Estimate story points
3. Balance workload across team members
4. Identify dependencies and risks
`;

const RETROSPECTIVE_PROMPT = `
Context: Sprint retrospective.
Sprint metrics: {metrics}

Guide the user through:
1. What went well
2. What could be improved
3. Action items for next sprint
4. Team health assessment
`;
```

### Deep Thinking Mode

```typescript
const DEEP_THINKING_PROMPT = `
Activate deep analysis mode.

Task: {userQuery}

Approach:
1. Break down the problem systematically
2. Consider multiple perspectives
3. Analyze historical data and patterns
4. Provide detailed reasoning
5. Suggest multiple solutions with trade-offs
6. Include implementation steps
`;
```

## AI Features

### 1. Smart Task Creation

```typescript
// Natural language to task
User: "Create a task to implement user authentication with JWT"

AI Response: {
  action: 'CREATE_TASK',
  data: {
    title: 'Implement JWT Authentication',
    description: 'Set up JWT-based authentication...',
    type: 'STORY',
    storyPoints: 5,
    labels: ['backend', 'security'],
    subtasks: [
      'Set up JWT library',
      'Create auth endpoints',
      'Implement token validation',
      'Add refresh token logic'
    ]
  }
}
```

### 2. Sprint Planning Assistant

```typescript
interface SprintPlanningAssistance {
  suggestedTasks: Task[];
  totalStoryPoints: number;
  riskAssessment: RiskLevel;
  recommendations: string[];
  capacityAnalysis: CapacityReport;
}
```

### 3. Methodology Compliance

```typescript
interface ComplianceCheck {
  violations: Violation[];
  suggestions: Suggestion[];
  score: number;
  improvements: Improvement[];
}
```

### 4. Proactive Assistance

```typescript
// Triggered by project events
const PROACTIVE_TRIGGERS = {
  SPRINT_START: 'Sprint started - review goals',
  SPRINT_MID: 'Mid-sprint check - assess progress',
  SPRINT_END: 'Sprint ending - prepare for review',
  BLOCKED_TASKS: 'Tasks blocked - suggest solutions',
  LOW_VELOCITY: 'Velocity dropping - analyze causes',
};
```

## API Endpoints

### GraphQL Mutations

```graphql
mutation SendAIMessage($input: AIMessageInput!) {
  sendAIMessage(input: $input) {
    id
    content
    role
    timestamp
    actions {
      type
      data
    }
  }
}

mutation ExecuteAIAction($actionId: ID!) {
  executeAIAction(actionId: $actionId) {
    success
    result
    message
  }
}
```

### GraphQL Queries

```graphql
query GetAIChatHistory($projectId: ID!) {
  aiChatHistory(projectId: $projectId) {
    messages {
      id
      content
      role
      timestamp
    }
    context {
      project
      sprint
      user
    }
  }
}

query GetAISuggestions($context: AIContextInput!) {
  aiSuggestions(context: $context) {
    suggestions {
      id
      type
      content
      priority
      actionable
    }
  }
}
```

### GraphQL Subscriptions

```graphql
subscription OnAIMessage($projectId: ID!) {
  aiMessageReceived(projectId: $projectId) {
    id
    content
    role
    timestamp
    streaming
  }
}
```

## Context Management

### Context Builder

```typescript
class AIContextBuilder {
  private context: AIContext = {};

  withProject(project: Project): this {
    this.context.project = {
      id: project.id,
      name: project.name,
      status: project.status,
      metrics: project.metrics,
    };
    return this;
  }

  withSprint(sprint: Sprint): this {
    this.context.sprint = {
      id: sprint.id,
      name: sprint.name,
      velocity: sprint.velocity,
      progress: sprint.progress,
    };
    return this;
  }

  withUser(user: User): this {
    this.context.user = {
      id: user.id,
      role: user.role,
      permissions: user.permissions,
    };
    return this;
  }

  withHistory(messages: Message[]): this {
    this.context.history = messages.slice(-10);
    return this;
  }

  build(): AIContext {
    return this.context;
  }
}
```

### Context Storage

```typescript
interface AIContextStorage {
  save(userId: string, context: AIContext): Promise<void>;
  load(userId: string): Promise<AIContext>;
  clear(userId: string): Promise<void>;
  update(userId: string, updates: Partial<AIContext>): Promise<void>;
}
```

## Security Considerations

### Data Privacy

- No sensitive data in prompts
- User permission validation
- Data anonymization option
- Audit logging for all AI actions

### Rate Limiting

```typescript
const AI_RATE_LIMITS = {
  messagesPerMinute: 10,
  messagesPerHour: 100,
  actionsPerHour: 50,
  tokensPerDay: 100000,
};
```

### Input Validation

```typescript
class AIInputValidator {
  validateMessage(message: string): ValidationResult {
    // Check for injection attempts
    // Validate message length
    // Check for prohibited content
    // Verify user permissions
  }

  validateAction(action: AIAction): ValidationResult {
    // Verify action type
    // Validate action data
    // Check user permissions
    // Verify resource access
  }
}
```

## Usage Examples

### Task Creation

```typescript
// User message
"Create a high-priority bug fix task for the login issue"

// AI Response
{
  "message": "I'll create a high-priority bug fix task for the login issue.",
  "action": {
    "type": "CREATE_TASK",
    "data": {
      "title": "Fix login authentication issue",
      "type": "BUG",
      "priority": "HIGH",
      "description": "Users are unable to login due to authentication error",
      "assignee": null,
      "labels": ["bug", "authentication", "urgent"]
    }
  }
}
```

### Sprint Analysis

```typescript
// User message
"Analyze our current sprint performance"

// AI Response
{
  "message": "Here's the analysis of your current sprint:\n\n**Sprint Progress**: 65% complete\n**Velocity**: 32 story points (target: 40)\n**Blocked Tasks**: 3\n\n**Recommendations**:\n1. Address blocked tasks immediately\n2. Consider moving 2 low-priority stories to next sprint\n3. Schedule a team sync to discuss impediments",
  "data": {
    "metrics": {
      "completion": 0.65,
      "velocity": 32,
      "blocked": 3,
      "risks": ["deadline", "resources"]
    }
  }
}
```

### Methodology Guidance

```typescript
// User message
"Should we extend the sprint by 2 days?"

// AI Response
{
  "message": "According to SCRUM best practices, extending a sprint is generally not recommended. Here's why:\n\n1. **Fixed timeboxes** are fundamental to SCRUM\n2. **Predictability** is compromised with variable sprint lengths\n3. **Team rhythm** can be disrupted\n\n**Alternative suggestions**:\n- Move incomplete stories to the next sprint\n- Conduct a retrospective to understand why targets weren't met\n- Adjust velocity expectations for future sprints\n- Consider if stories were properly sized",
  "suggestions": [
    "Move 3 incomplete stories to backlog",
    "Schedule sprint retrospective",
    "Review estimation practices"
  ]
}
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Security Guide](./SECURITY.md)
- [Development Guide](./DEVELOPMENT.md)

---

Last updated: September 2025
