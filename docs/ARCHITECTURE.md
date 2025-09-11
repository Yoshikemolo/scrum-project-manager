# Architecture Overview

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Microservices Architecture](#microservices-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Technology Stack Details](#technology-stack-details)
8. [Design Patterns](#design-patterns)
9. [Scalability Considerations](#scalability-considerations)
10. [Related Documentation](#related-documentation)

## System Architecture

The SCRUM Project Manager is built using a microservices architecture with a clear separation of concerns. The system consists of:

- **Frontend**: Angular 20 single-page application
- **API Gateway**: GraphQL endpoint aggregating microservices
- **Microservices**: Specialized services for different domains
- **Database**: PostgreSQL for persistent storage
- **Cache**: Redis for session management and caching
- **Message Queue**: Event-driven communication between services

## Microservices Architecture

### API Gateway

- **Purpose**: Central entry point for all client requests
- **Technology**: NestJS with Apollo Server
- **Responsibilities**:
  - Request routing
  - Authentication validation
  - Response aggregation
  - Rate limiting
  - Request/Response transformation

### Identity Service

- **Purpose**: User authentication and authorization
- **Responsibilities**:
  - User registration and activation
  - JWT token generation and validation
  - Role-based access control (RBAC)
  - Password reset functionality
  - User profile management
  - Group management

### Projects Service

- **Purpose**: Core project management functionality
- **Responsibilities**:
  - Project CRUD operations
  - Sprint management
  - Task management
  - Kanban board operations
  - Comments system
  - Project metrics and analytics
  - Subscription management

### AI Assistant Service

- **Purpose**: AI-powered assistance and automation
- **Responsibilities**:
  - ChatGPT-5 integration
  - Context-aware suggestions
  - Automated task creation
  - Project insights generation
  - Natural language processing
  - System prompt management

## Frontend Architecture

### Component Structure

```
frontend/
├── core/           # Core module with singleton services
├── shared/         # Shared components and utilities
├── features/       # Feature modules
│   ├── auth/      # Authentication feature
│   ├── dashboard/ # Dashboard feature
│   ├── projects/  # Projects management
│   ├── tasks/     # Tasks and Kanban
│   └── ai-chat/   # AI Assistant chat
└── layouts/       # Application layouts
```

### State Management

- **NgRx Store**: Centralized state management
- **Effects**: Side effect handling
- **Entity Adapter**: Normalized state structure
- **Selectors**: Memoized state queries

## Data Flow

### Request Flow

1. User interacts with Angular frontend
2. Frontend dispatches action to NgRx store
3. Effect triggers GraphQL query/mutation
4. API Gateway receives request
5. Gateway validates JWT token
6. Gateway routes to appropriate microservice
7. Microservice processes request
8. Response flows back through gateway
9. Frontend updates store with response
10. UI updates reactively

### Real-time Updates

- WebSocket connection for live updates
- GraphQL subscriptions for real-time data
- Push notifications for important events

## Security Architecture

### Authentication Flow

1. User provides credentials
2. Identity service validates credentials
3. JWT token generated with user claims
4. Token stored in frontend (HttpOnly cookie)
5. Token included in subsequent requests
6. Gateway validates token on each request

### Authorization

- Role-based access control (RBAC)
- Resource-level permissions
- API endpoint protection
- Frontend route guards

### Security Measures

- HTTPS everywhere
- JWT token rotation
- Rate limiting
- CORS configuration
- SQL injection prevention
- XSS protection
- CSRF tokens

## Deployment Architecture

### Development Environment

- Docker Compose for local development
- Hot reloading for all services
- Shared volumes for code synchronization

### Production Environment

- Kubernetes cluster deployment
- Horizontal pod autoscaling
- Load balancing with Nginx
- SSL termination at ingress
- Database connection pooling

### CI/CD Pipeline

1. Code push to GitHub
2. GitHub Actions triggered
3. Run tests and linting
4. Build Docker images
5. Push to container registry
6. Deploy to staging environment
7. Run E2E tests
8. Deploy to production

## Technology Stack Details

### Frontend Technologies

- **Angular 20**: Latest Angular framework
- **Angular Material**: UI components
- **SCSS**: Styling with variables and mixins
- **NgRx**: State management
- **Apollo Client**: GraphQL client
- **Socket.io Client**: WebSocket communication

### Backend Technologies

- **NestJS**: Node.js framework
- **GraphQL**: API query language
- **TypeORM**: Object-relational mapping
- **PostgreSQL**: Primary database
- **Redis**: Caching and sessions
- **Passport**: Authentication middleware
- **Bull**: Job queue management

### DevOps Technologies

- **Docker**: Containerization
- **Kubernetes**: Container orchestration
- **GitHub Actions**: CI/CD
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **ELK Stack**: Logging

## Design Patterns

### Backend Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic encapsulation
- **Dependency Injection**: IoC container usage
- **Factory Pattern**: Object creation
- **Observer Pattern**: Event-driven architecture
- **Strategy Pattern**: Algorithm selection

### Frontend Patterns

- **Smart/Dumb Components**: Presentation separation
- **Facade Pattern**: Service simplification
- **Singleton Pattern**: Core services
- **Module Pattern**: Feature organization
- **Observable Pattern**: Reactive programming

## Scalability Considerations

### Horizontal Scaling

- Stateless microservices
- Database read replicas
- Load balancing
- Caching strategies

### Performance Optimization

- Lazy loading modules
- Code splitting
- Image optimization
- Query optimization
- Connection pooling
- Response compression

### Monitoring and Observability

- Application metrics
- Error tracking
- Performance monitoring
- User analytics
- Infrastructure monitoring

## Related Documentation

- [API Documentation](./API.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)
- [AI Integration](./AI_INTEGRATION.md)

---

Last updated: September 2025
