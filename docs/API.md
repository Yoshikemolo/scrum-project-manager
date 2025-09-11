# API Documentation

## Table of Contents

1. [GraphQL Schema Overview](#graphql-schema-overview)
2. [Authentication](#authentication)
3. [Core Types](#core-types)
4. [Queries](#queries)
5. [Mutations](#mutations)
6. [Subscriptions](#subscriptions)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Pagination](#pagination)
10. [Related Documentation](#related-documentation)

## GraphQL Schema Overview

The API uses GraphQL to provide a flexible and efficient way to query and mutate data. The schema is organized into several modules:

- **Auth Module**: Authentication and authorization
- **Users Module**: User management
- **Projects Module**: Project and sprint management
- **Tasks Module**: Task and kanban operations
- **AI Module**: AI assistant interactions

## Authentication

### Login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    refreshToken
    user {
      id
      email
      firstName
      lastName
      roles
    }
  }
}
```

### Register

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    success
    message
    user {
      id
      email
    }
  }
}
```

### Refresh Token

```graphql
mutation RefreshToken($refreshToken: String!) {
  refreshToken(refreshToken: $refreshToken) {
    accessToken
    refreshToken
  }
}
```

## Core Types

### User Type

```graphql
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  avatar: String
  roles: [Role!]!
  groups: [Group!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  isActive: Boolean!
  preferences: UserPreferences!
}
```

### Project Type

```graphql
type Project {
  id: ID!
  name: String!
  description: String
  key: String!
  owner: User!
  members: [User!]!
  sprints: [Sprint!]!
  backlog: [Task!]!
  status: ProjectStatus!
  visibility: ProjectVisibility!
  createdAt: DateTime!
  updatedAt: DateTime!
  metrics: ProjectMetrics!
}
```

### Sprint Type

```graphql
type Sprint {
  id: ID!
  name: String!
  goal: String
  startDate: DateTime!
  endDate: DateTime!
  project: Project!
  tasks: [Task!]!
  status: SprintStatus!
  velocity: Float!
  burndownData: [BurndownPoint!]!
}
```

### Task Type

```graphql
type Task {
  id: ID!
  title: String!
  description: String
  type: TaskType!
  priority: TaskPriority!
  status: TaskStatus!
  storyPoints: Int
  assignee: User
  reporter: User!
  sprint: Sprint
  project: Project!
  comments: [Comment!]!
  attachments: [Attachment!]!
  labels: [String!]!
  createdAt: DateTime!
  updatedAt: DateTime!
  dueDate: DateTime
  completedAt: DateTime
}
```

## Queries

### Get Current User

```graphql
query GetCurrentUser {
  currentUser {
    id
    email
    firstName
    lastName
    roles
    groups
    preferences {
      theme
      language
      notifications
    }
  }
}
```

### Get Projects

```graphql
query GetProjects($filter: ProjectFilter, $pagination: PaginationInput) {
  projects(filter: $filter, pagination: $pagination) {
    items {
      id
      name
      description
      key
      status
      owner {
        id
        email
      }
    }
    totalCount
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
}
```

### Get Project Details

```graphql
query GetProjectDetails($id: ID!) {
  project(id: $id) {
    id
    name
    description
    sprints {
      id
      name
      status
      startDate
      endDate
    }
    backlog {
      id
      title
      status
      priority
    }
    metrics {
      totalTasks
      completedTasks
      velocity
      burndownData
    }
  }
}
```

### Get Sprint Tasks

```graphql
query GetSprintTasks($sprintId: ID!) {
  sprint(id: $sprintId) {
    id
    name
    tasks {
      id
      title
      status
      assignee {
        id
        firstName
        lastName
      }
      storyPoints
    }
  }
}
```

## Mutations

### Create Project

```graphql
mutation CreateProject($input: CreateProjectInput!) {
  createProject(input: $input) {
    id
    name
    key
    description
  }
}
```

### Create Sprint

```graphql
mutation CreateSprint($input: CreateSprintInput!) {
  createSprint(input: $input) {
    id
    name
    startDate
    endDate
    goal
  }
}
```

### Create Task

```graphql
mutation CreateTask($input: CreateTaskInput!) {
  createTask(input: $input) {
    id
    title
    description
    status
    priority
  }
}
```

### Update Task Status

```graphql
mutation UpdateTaskStatus($id: ID!, $status: TaskStatus!) {
  updateTaskStatus(id: $id, status: $status) {
    id
    status
    updatedAt
  }
}
```

### Add Comment

```graphql
mutation AddComment($input: AddCommentInput!) {
  addComment(input: $input) {
    id
    content
    author {
      id
      firstName
      lastName
    }
    createdAt
  }
}
```

### Move Task

```graphql
mutation MoveTask($taskId: ID!, $targetStatus: TaskStatus!, $position: Int) {
  moveTask(taskId: $taskId, targetStatus: $targetStatus, position: $position) {
    id
    status
    position
  }
}
```

## Subscriptions

### Task Updates

```graphql
subscription OnTaskUpdate($projectId: ID!) {
  taskUpdated(projectId: $projectId) {
    id
    title
    status
    assignee {
      id
      firstName
    }
    updatedAt
  }
}
```

### Sprint Updates

```graphql
subscription OnSprintUpdate($projectId: ID!) {
  sprintUpdated(projectId: $projectId) {
    id
    name
    status
    velocity
  }
}
```

### Comments Stream

```graphql
subscription OnCommentAdded($taskId: ID!) {
  commentAdded(taskId: $taskId) {
    id
    content
    author {
      id
      firstName
      lastName
      avatar
    }
    createdAt
  }
}
```

## Error Handling

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Authentication required",
      "extensions": {
        "code": "UNAUTHENTICATED",
        "timestamp": "2025-09-11T10:00:00Z"
      }
    }
  ]
}
```

### Common Error Codes

- `UNAUTHENTICATED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `BAD_REQUEST`: Invalid input data
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict
- `INTERNAL_ERROR`: Server error
- `RATE_LIMITED`: Too many requests

## Rate Limiting

### Limits

- **Anonymous**: 100 requests per hour
- **Authenticated**: 1000 requests per hour
- **Premium**: 5000 requests per hour

### Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1631361600
```

## Pagination

### Input

```graphql
input PaginationInput {
  page: Int
  limit: Int
  sortBy: String
  sortOrder: SortOrder
}
```

### Response

```graphql
type PaginatedResponse {
  items: [T!]!
  totalCount: Int!
  pageInfo: PageInfo!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Security Guide](./SECURITY.md)
- [AI Integration](./AI_INTEGRATION.md)

---

Last updated: September 2025
