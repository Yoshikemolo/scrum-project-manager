# Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Test Coverage](#test-coverage)
9. [CI/CD Integration](#cicd-integration)
10. [Related Documentation](#related-documentation)

## Overview

This guide outlines the comprehensive testing strategy for the SCRUM Project Manager platform. Our testing approach ensures code quality, reliability, and maintainability across all components of the system.

## Testing Strategy

### Testing Pyramid

```
            /\
           /  \
          / E2E \
         /________\
        /          \
       / Integration\
      /______________\
     /                \
    /   Unit Tests     \
   /____________________\
```

### Test Types Distribution

- **Unit Tests**: 70% - Fast, isolated component testing
- **Integration Tests**: 20% - Service interaction testing
- **E2E Tests**: 10% - Critical user journey testing

### Testing Principles

1. **Test First**: Write tests before implementation (TDD)
2. **Fast Feedback**: Tests run quickly in development
3. **Isolation**: Tests are independent and repeatable
4. **Coverage**: Maintain minimum 80% code coverage
5. **Documentation**: Tests serve as living documentation

## Unit Testing

### Frontend Unit Tests

#### Component Testing

```typescript
// task-card.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskCardComponent } from './task-card.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('TaskCardComponent', () => {
  let component: TaskCardComponent;
  let fixture: ComponentFixture<TaskCardComponent>;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        // Mock providers
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display task title', () => {
      component.task = mockTask;
      fixture.detectChanges();
      
      const titleElement = debugElement.query(By.css('.task-title'));
      expect(titleElement.nativeElement.textContent).toContain(mockTask.title);
    });
  });

  describe('User Interactions', () => {
    it('should emit edit event on edit button click', () => {
      spyOn(component.edit, 'emit');
      
      const editButton = debugElement.query(By.css('.edit-button'));
      editButton.nativeElement.click();
      
      expect(component.edit.emit).toHaveBeenCalledWith(component.task);
    });
  });
});
```

#### Service Testing

```typescript
// task.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTasks', () => {
    it('should return tasks from API', () => {
      const mockTasks = [createMockTask(), createMockTask()];

      service.getTasks().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne('/api/tasks');
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });
  });
});
```

### Backend Unit Tests

#### Service Testing

```typescript
// task.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';

describe('TaskService', () => {
  let service: TaskService;
  let repository: Repository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
      };

      const savedTask = {
        id: '123',
        ...createTaskDto,
      };

      jest.spyOn(repository, 'save').mockResolvedValue(savedTask as any);

      const result = await service.create(createTaskDto);

      expect(result).toEqual(savedTask);
      expect(repository.save).toHaveBeenCalledWith(createTaskDto);
    });
  });
});
```

#### Controller Testing

```typescript
// task.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const result = [{ id: '1', title: 'Task 1' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(result as any);

      expect(await controller.findAll()).toBe(result);
    });
  });
});
```

## Integration Testing

### API Integration Tests

```typescript
// app.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Task Operations', () => {
    it('should create and retrieve a task', async () => {
      const createDto = {
        title: 'Integration Test Task',
        description: 'Test Description',
      };

      // Create task
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .send(createDto)
        .expect(201);

      const taskId = createResponse.body.id;

      // Retrieve task
      const getResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(getResponse.body.title).toBe(createDto.title);
    });
  });
});
```

### Database Integration Tests

```typescript
// database.integration.spec.ts
import { DataSource } from 'typeorm';
import { Task } from '../entities/task.entity';

describe('Database Integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test',
      password: 'test',
      database: 'test_db',
      entities: [Task],
      synchronize: true,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should save and retrieve task from database', async () => {
    const taskRepository = dataSource.getRepository(Task);
    
    const task = new Task();
    task.title = 'Database Test';
    task.description = 'Testing database integration';
    
    const savedTask = await taskRepository.save(task);
    const foundTask = await taskRepository.findOne({ 
      where: { id: savedTask.id } 
    });
    
    expect(foundTask).toBeDefined();
    expect(foundTask.title).toBe(task.title);
  });
});
```

## End-to-End Testing

### Cypress E2E Tests

```typescript
// cypress/e2e/task-management.cy.ts
describe('Task Management', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/projects/1/tasks');
  });

  it('should create a new task', () => {
    cy.get('[data-cy=add-task-button]').click();
    
    cy.get('[data-cy=task-title-input]')
      .type('E2E Test Task');
    
    cy.get('[data-cy=task-description-input]')
      .type('This is an E2E test task description');
    
    cy.get('[data-cy=task-priority-select]')
      .select('HIGH');
    
    cy.get('[data-cy=save-task-button]').click();
    
    cy.get('[data-cy=task-list]')
      .should('contain', 'E2E Test Task');
  });

  it('should drag and drop task between columns', () => {
    cy.get('[data-cy=task-card-1]')
      .drag('[data-cy=in-progress-column]');
    
    cy.get('[data-cy=in-progress-column]')
      .should('contain', 'Task 1');
  });
});
```

### Critical User Journeys

```typescript
// cypress/e2e/user-journey.cy.ts
describe('User Journey: Sprint Planning', () => {
  it('should complete sprint planning workflow', () => {
    // Login
    cy.visit('/login');
    cy.get('[data-cy=email]').type('pm@example.com');
    cy.get('[data-cy=password]').type('password');
    cy.get('[data-cy=login-button]').click();
    
    // Navigate to project
    cy.get('[data-cy=project-card]').first().click();
    
    // Create sprint
    cy.get('[data-cy=create-sprint]').click();
    cy.get('[data-cy=sprint-name]').type('Sprint 10');
    cy.get('[data-cy=sprint-goal]').type('Complete user authentication');
    cy.get('[data-cy=create-button]').click();
    
    // Add tasks to sprint
    cy.get('[data-cy=backlog-task]').first()
      .drag('[data-cy=sprint-tasks]');
    
    // Start sprint
    cy.get('[data-cy=start-sprint]').click();
    cy.get('[data-cy=confirm-start]').click();
    
    // Verify sprint started
    cy.get('[data-cy=sprint-status]')
      .should('contain', 'Active');
  });
});
```

## Performance Testing

### Load Testing

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function () {
  const response = http.get('https://api.scrum-pm.com/graphql', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Performance Benchmarks

- **API Response Time**: < 200ms (p95)
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **Database Query Time**: < 100ms (p95)
- **WebSocket Latency**: < 50ms

## Security Testing

### Vulnerability Scanning

```bash
# Dependency vulnerability scanning
npm audit

# OWASP dependency check
npx owasp-dependency-check --project "SCRUM PM" --scan .

# Container security scanning
docker scan scrum-pm:latest
```

### Penetration Testing

```typescript
// security/auth.security.spec.ts
describe('Authentication Security', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: maliciousInput,
        password: 'password',
      })
      .expect(400);
    
    expect(response.body.message).toContain('Invalid input');
  });

  it('should rate limit login attempts', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong',
        });
    }
    
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'correct',
      })
      .expect(429);
    
    expect(response.body.message).toContain('Too many requests');
  });
});
```

## Test Coverage

### Coverage Requirements

- **Overall**: Minimum 80%
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/dist/',
    '.spec.ts',
    '.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
};
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# View HTML report
open coverage/lcov-report/index.html

# Generate coverage badge
npm run coverage:badge
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Generate coverage report
        run: npm run test:cov
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: npm run test:e2e:ci
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Test Automation

- **Pre-commit**: Linting and unit tests
- **Pre-push**: Integration tests
- **Pull Request**: Full test suite
- **Main Branch**: Full suite + E2E tests
- **Nightly**: Performance and security tests

## Related Documentation

- [Development Guide](./DEVELOPMENT.md)
- [CI/CD Pipeline](./DEPLOYMENT.md#cicd-pipeline)
- [Code Quality Standards](./CONTRIBUTING.md#coding-standards)
- [Security Guide](./SECURITY.md)

---

Last updated: September 2025
