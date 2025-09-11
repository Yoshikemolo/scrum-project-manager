# Contributing Guide

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Requirements](#testing-requirements)
8. [Documentation](#documentation)
9. [Community](#community)
10. [Related Documentation](#related-documentation)

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members
- Be collaborative and constructive

## Getting Started

### Fork and Clone

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/scrum-project-manager.git
cd scrum-project-manager

# Add upstream remote
git remote add upstream https://github.com/Yoshikemolo/scrum-project-manager.git

# Keep your fork updated
git fetch upstream
git checkout main
git merge upstream/main
```

### Environment Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development environment
docker-compose up -d
npm run dev
```

## Development Process

### Issue Creation

Before starting work:

1. Check existing issues
2. Create a new issue if needed
3. Discuss the approach
4. Get issue assigned

### Branch Naming

```bash
# Feature
git checkout -b feature/issue-123-add-user-dashboard

# Bug fix
git checkout -b fix/issue-456-login-error

# Documentation
git checkout -b docs/update-api-guide

# Refactoring
git checkout -b refactor/improve-task-service
```

## Coding Standards

### TypeScript Guidelines

```typescript
// Use interfaces for type definitions
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Use enums for constants
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

// Use async/await over promises
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await userService.findById(id);
    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

// Use destructuring
const { id, email } = user;

// Use template literals
const message = `Welcome ${user.firstName}!`;
```

### Angular Best Practices

```typescript
// Component example
@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks$ = this.store.select(selectAllTasks);
  private destroy$ = new Subject<void>();

  constructor(
    private store: Store,
    private taskService: TaskService,
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTasks(): void {
    this.taskService
      .getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks) => {
        this.store.dispatch(loadTasksSuccess({ tasks }));
      });
  }
}
```

### NestJS Best Practices

```typescript
// Service example
@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private logger: Logger,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    this.logger.log(`Creating task: ${createTaskDto.title}`);
    
    const task = this.taskRepository.create(createTaskDto);
    
    try {
      return await this.taskRepository.save(task);
    } catch (error) {
      this.logger.error(`Failed to create task: ${error.message}`);
      throw new InternalServerErrorException('Failed to create task');
    }
  }
}
```

### SCSS Guidelines

```scss
// Use variables
$primary-color: #0066FF;
$secondary-color: #111111;
$spacing-unit: 8px;

// Use BEM methodology
.task-card {
  padding: $spacing-unit * 2;
  
  &__header {
    display: flex;
    justify-content: space-between;
  }
  
  &__title {
    font-size: 1.2rem;
    color: $primary-color;
  }
  
  &--completed {
    opacity: 0.6;
  }
}

// Use mixins
@mixin card-shadow {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card {
  @include card-shadow;
}
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Adding tests
- **chore**: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(tasks): add drag and drop functionality"

# Bug fix
git commit -m "fix(auth): resolve JWT token expiration issue"

# Documentation
git commit -m "docs(api): update GraphQL schema documentation"

# With body
git commit -m "feat(projects): implement project archiving

- Add archive flag to project entity
- Create archive/unarchive mutations
- Update UI to show archived projects
- Add tests for archiving functionality

Closes #123"
```

## Pull Request Process

### Before Submitting

1. **Update from upstream**
```bash
git fetch upstream
git rebase upstream/main
```

2. **Run tests**
```bash
npm run test
npm run test:e2e
npm run lint
```

3. **Update documentation**
- Update README if needed
- Add/update API documentation
- Update changelog

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
- [ ] All tests passing

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #(issue number)
```

### Review Process

1. Automated checks must pass
2. At least one approving review required
3. No unresolved conversations
4. Branch must be up to date with main

## Testing Requirements

### Unit Tests

```typescript
// Example test
describe('TaskService', () => {
  let service: TaskService;
  let repository: Repository<Task>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    repository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
      };

      const expectedTask = {
        id: '123',
        ...createTaskDto,
      };

      jest.spyOn(repository, 'create').mockReturnValue(expectedTask as any);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedTask as any);

      const result = await service.create(createTaskDto);

      expect(result).toEqual(expectedTask);
      expect(repository.create).toHaveBeenCalledWith(createTaskDto);
      expect(repository.save).toHaveBeenCalledWith(expectedTask);
    });
  });
});
```

### Coverage Requirements

- Minimum 80% code coverage
- All critical paths must be tested
- Edge cases should be covered

## Documentation

### Code Documentation

```typescript
/**
 * Creates a new task in the project
 * @param createTaskDto - The task creation data
 * @returns The created task
 * @throws {BadRequestException} If validation fails
 * @throws {NotFoundException} If project not found
 * @example
 * const task = await taskService.create({
 *   title: 'Implement feature',
 *   projectId: 'project-123',
 * });
 */
async create(createTaskDto: CreateTaskDto): Promise<Task> {
  // Implementation
}
```

### API Documentation

- Update GraphQL schema
- Update Postman collection
- Add examples for new endpoints

## Community

### Communication Channels

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General discussions
- Email: dev@scrum-pm.com

### Getting Help

- Read the documentation
- Search existing issues
- Ask in discussions
- Contact maintainers

## Related Documentation

- [Development Guide](./DEVELOPMENT.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Testing Guide](./TESTING.md)
- [Security Guide](./SECURITY.md)

---

Thank you for contributing to SCRUM Project Manager!

Last updated: September 2025
