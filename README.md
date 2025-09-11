# SCRUM Project Manager

## Enterprise SCRUM Project Management Platform with AI Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-20-red.svg)](https://angular.io/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-16-pink.svg)](https://graphql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

A comprehensive SCRUM project management platform built with modern technologies, featuring AI-powered assistance, real-time collaboration, and enterprise-grade security.

## Features

### Core Features
- **Project Dashboard**: Visual metrics and KPIs for project tracking
- **Sprint Management**: Create and manage sprints with planning tools
- **Task Management**: Kanban board with drag-and-drop functionality
- **Comments System**: Collaborate on tasks with threaded discussions
- **Notifications**: Email and push notifications for updates
- **Dark/Light Mode**: Customizable UI themes
- **Internationalization**: Multi-language support (i18n)
- **Team Management**: User groups and permissions (RBAC)

### AI Features
- **AI Assistant**: ChatGPT-5 integration for intelligent assistance
- **Smart Suggestions**: Context-aware tips for methodology compliance
- **Deep Thinking**: Automatic system prompt selection for complex queries
- **Action Automation**: AI-driven task and project management

### Technical Features
- **Security**: JWT authentication with Bearer tokens
- **Authorization**: Role-Based Access Control (RBAC)
- **Real-time Updates**: WebSocket connections for live data
- **Microservices**: Scalable architecture with service separation
- **Performance**: Optimized for enterprise-scale deployments

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend (Angular 20)                 │
│                     Material UI + SCSS                   │
└─────────────────────────────┬────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│                  API Gateway (GraphQL)                   │
└──────────────┬──────────────┬──────────────┬─────────────┘
               │              │              │
               ▼              ▼              ▼
          ┌──────────┐  ┌──────────┐  ┌──────────────┐
          │ Identity │  │ Projects │  │ AI Assistant │
          │  Service │  │  Service │  │    Service   │
          │ (NestJS) │  │ (NestJS) │  │    (NestJS)  │
          └──────────┘  └──────────┘  └──────────────┘
                │              │              │
                └──────────────┴──────────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │   PostgreSQL DB  │
                      └──────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Angular 20
- **UI Library**: Angular Material
- **Styling**: SCSS with BEM methodology
- **State Management**: NgRx
- **Build Tool**: Nx

### Backend
- **Framework**: NestJS
- **API**: GraphQL with Apollo Server
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: JWT with Passport
- **Microservices**: Node.js services

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus & Grafana
- **Documentation**: Compodoc & Markdown

## Getting Started

### Prerequisites
```bash
- Node.js >= 20.x
- npm >= 10.x
- Docker >= 24.x
- Docker Compose >= 2.x
- PostgreSQL >= 15.x
```

### Installation

1. Clone the repository
```bash
git clone https://github.com/Yoshikemolo/scrum-project-manager.git
cd scrum-project-manager
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start with Docker Compose
```bash
docker-compose up -d
```

5. Run migrations
```bash
npm run migration:run
```

6. Start development servers
```bash
npm run dev
```

### Quick Start Commands

```bash
# Development
npm run dev              # Start all services in dev mode
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend services

# Production
npm run build            # Build all applications
npm run start:prod       # Start in production mode

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests
npm run test:cov         # Generate coverage report

# Documentation
npm run docs:generate    # Generate Compodoc documentation
npm run docs:serve       # Serve documentation locally
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guide](./docs/SECURITY.md)
- [AI Integration](./docs/AI_INTEGRATION.md)

### Self Dopcumentation with Compodoc

This project is provided with code inline documentation that can be generated automatically by using Compodoc tools.

Documentation (Nx Monorepo + Compodoc)
1. Install (once per workspace)
```
npm i -D @compodoc/compodoc
```
*Note: The project already have installed Compodoc in the package. So skip this step*

**TIP:** Use `npmp install` to install all project dependencies, including Compodoc.

2. Generate docs (per app/lib)
#### Example for an app
```
npx compodoc -p apps/<app-name>/tsconfig.app.json -d docs/<app-name>
```

#### Example for a lib
```
npx compodoc -p libs/<lib-name>/tsconfig.lib.json -d docs/<lib-name>
```

Output location: `docs/<project-name>/` (you can choose any folder via -d). 


3. Serve docs (choose port if 8080 is busy)
#### Generate + serve immediately on a custom port (e.g., 4205)
```
npx compodoc -p apps/<app-name>/tsconfig.app.json -d docs/<app-name> -s --port 4205
```

#### Serve an already generated folder
```
npx compodoc -s -d docs/<app-name> --port 4205
```

You can also use the short flag -r for port: -s -r 4205. 
UNPKG

4. Optional: project scripts

Add shortcuts to your root package.json:
```
{
  "scripts": {
    "docs:generate:app": "compodoc -p apps/<app-name>/tsconfig.app.json -d docs/<app-name>",
    "docs:serve:app": "compodoc -s -d docs/<app-name> --port 4205"
  }
}
```

5. JSDoc/TSDoc comments (auto-documentation)

Use JSDoc blocks above classes, inputs/outputs, and methods:
```
// file: libs/company/src/lib/company.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from './models';

/**
 * Service responsible for Company read operations.
 * Provides a typed API used across UI modules.
 */
@Injectable({ providedIn: 'root' })
export class CompanyService {
  /**
   * Fetch a company by its identifier.
   * @param id Company UUID.
   * @returns Observable that emits the Company when available.
   */
  getCompany(id: string): Observable<Company> {
    // ...
    return new Observable<Company>();
  }
}

// file: libs/ui/src/lib/button/button.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Primary action button.
 * @example
 * <x-button label="Save" (pressed)="onSave()"></x-button>
 */
@Component({
  selector: 'x-button',
  template: `<button (click)="pressed.emit()">{{ label }}</button>`
})
export class ButtonComponent {
  /** Text displayed inside the button. */
  @Input() label = 'OK';

  /** Emits when the button is pressed. */
  @Output() pressed = new EventEmitter<void>();
}
```

6. Nx monorepo note

Run Compodoc separately for each apps/* and libs/* you want documented; point -p to the correct tsconfig.*.json. 
compodoc.app

7. More information

For further information, visit [Official Compodoc docs](https://compodoc.app/) (options, config files, usage). 


## Testing

```bash
# Unit Tests
npm run test

# Integration Tests
npm run test:integration

# E2E Tests
npm run test:e2e

# Coverage Report
npm run test:cov
```

## Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

## Contributing

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with by [Ximplicity](https://ximplicity.com)
- Powered by cutting-edge open-source technologies
- AI integration with OpenAI's GPT-5

---

© 2025 Ximplicity Software Solutions. All Rights Reserved.
