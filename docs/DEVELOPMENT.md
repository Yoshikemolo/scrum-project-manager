# Development Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Tasks](#common-tasks)
9. [Troubleshooting](#troubleshooting)
10. [Related Documentation](#related-documentation)

## Prerequisites

### Required Software

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker >= 24.0.0
- Docker Compose >= 2.0.0
- Git >= 2.40.0
- PostgreSQL >= 15.0 (for local development without Docker)
- Redis >= 7.0 (for local development without Docker)

### Recommended Tools

- Visual Studio Code
- Chrome DevTools
- Postman or GraphQL Playground
- pgAdmin or DBeaver
- Redis Commander

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Yoshikemolo/scrum-project-manager.git
cd scrum-project-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=scrum_user
DATABASE_PASSWORD=scrum_password
DATABASE_NAME=scrum_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-key
```

### 4. Start Docker Services

```bash
docker-compose up -d postgres redis
```

### 5. Run Database Migrations

```bash
npm run migration:run
```

### 6. Start Development Servers

```bash
npm run dev
```

## Project Structure

```
scrum-project-manager/
├── apps/
│   ├── frontend/                 # Angular application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── assets/
│   │   │   ├── environments/
│   │   │   └── styles/
│   │   └── project.json
│   ├── api-gateway/             # GraphQL API Gateway
│   │   ├── src/
│   │   │   ├── app/
│   │   │   └── main.ts
│   │   └── project.json
│   ├── identity-service/        # Identity microservice
│   ├── projects-service/        # Projects microservice
│   └── ai-assistant-service/    # AI microservice
├── libs/
│   ├── shared/
│   │   ├── interfaces/          # Shared TypeScript interfaces
│   │   ├── utils/               # Shared utilities
│   │   ├── constants/           # Shared constants
│   │   ├── dto/                 # Data Transfer Objects
│   │   └── entities/            # Database entities
│   ├── frontend/
│   │   └── ui/                  # Shared UI components
│   └── backend/
│       └── common/              # Shared backend utilities
├── docs/                        # Documentation
├── scripts/                     # Utility scripts
├── postman/                     # Postman collections
└── nginx/                       # Nginx configuration
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow the coding standards and ensure tests pass.

### 3. Run Tests

```bash
npm run test
npm run test:e2e
```

### 4. Lint and Format

```bash
npm run lint
npm run format
```

### 5. Commit Changes

```bash
git add .
git commit -m "feat: add new feature"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

## Coding Standards

### TypeScript

- Use strict type checking
- Avoid `any` type
- Use interfaces for object shapes
- Use enums for constants
- Prefer const assertions

### Angular

- Use OnPush change detection
- Implement OnDestroy for subscriptions
- Use async pipe in templates
- Follow Angular style guide
- Use reactive forms

### NestJS

- Use dependency injection
- Implement DTOs for validation
- Use guards for authentication
- Handle errors with filters
- Document with Swagger/OpenAPI

### SCSS

- Use BEM methodology
- Create variables for colors
- Use mixins for repeated styles
- Mobile-first approach
- Component-scoped styles

## Testing

### Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests for specific project
npm run test frontend
npm run test api-gateway

# Run tests with coverage
npm run test:cov
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headless mode
npm run test:e2e:headless
```

### Test Coverage

```bash
# Generate coverage report
npm run test:cov

# View coverage report
open coverage/index.html
```

## Debugging

### Frontend Debugging

1. Open Chrome DevTools
2. Go to Sources tab
3. Set breakpoints in TypeScript files
4. Use Angular DevTools extension

### Backend Debugging

1. Use VS Code debugger
2. Set breakpoints in TypeScript files
3. Run debug configuration
4. Inspect variables and call stack

### Database Debugging

```bash
# Connect to PostgreSQL
docker exec -it scrum-postgres psql -U scrum_user -d scrum_db

# View tables
\dt

# Describe table
\d table_name

# Query data
SELECT * FROM users;
```

## Common Tasks

### Generate New Component

```bash
# Angular component
nx g component my-component --project=frontend

# NestJS service
nx g service my-service --project=api-gateway
```

### Add New Library

```bash
nx g lib my-lib --directory=shared
```

### Run Specific Service

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Specific service
nx serve identity-service
```

### Database Operations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Build for Production

```bash
# Build all projects
npm run build:prod

# Build specific project
nx build frontend --configuration=production
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Reset Docker
docker-compose down -v
docker-compose up -d --build
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker logs scrum-postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Nx Cache Issues

```bash
# Clear Nx cache
nx reset
```

## Related Documentation

- [Project Objectives](./OBJECTIVES.md)
- [Project Planning](./PROJECT_PLANNING.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Testing Guide](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

Last updated: September 2025
