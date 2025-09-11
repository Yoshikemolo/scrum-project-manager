# Gitflow Workflow Guide

## Table of Contents

1. [Overview](#overview)
2. [Branch Structure](#branch-structure)
3. [Workflow Process](#workflow-process)
4. [Branch Naming Conventions](#branch-naming-conventions)
5. [Commit Message Format](#commit-message-format)
6. [Pull Request Process](#pull-request-process)
7. [Release Process](#release-process)
8. [Hotfix Process](#hotfix-process)
9. [Best Practices](#best-practices)
10. [Related Documentation](#related-documentation)

## Overview

This project follows the Gitflow workflow methodology to ensure organized and efficient development. Gitflow provides a robust framework for managing larger projects with scheduled releases and multiple developers.

## Branch Structure

### Main Branches

#### main (or master)
- **Purpose**: Production-ready code
- **Protected**: Yes
- **Direct commits**: No
- **Merges from**: release/* and hotfix/* branches only
- **Deployment**: Automatic to production

#### develop
- **Purpose**: Integration branch for features
- **Protected**: Yes
- **Direct commits**: No (except for minor documentation updates)
- **Merges from**: feature/*, release/*, and hotfix/* branches
- **Deployment**: Automatic to staging environment

### Supporting Branches

#### feature/*
- **Purpose**: New features and enhancements
- **Created from**: develop
- **Merged to**: develop
- **Naming**: feature/issue-number-description
- **Lifetime**: Until feature is complete and merged

#### release/*
- **Purpose**: Prepare for production release
- **Created from**: develop
- **Merged to**: main and develop
- **Naming**: release/version-number
- **Lifetime**: Until release is deployed

#### hotfix/*
- **Purpose**: Emergency fixes for production
- **Created from**: main
- **Merged to**: main and develop
- **Naming**: hotfix/issue-number-description
- **Lifetime**: Until fix is deployed

## Workflow Process

### Starting a New Feature

```bash
# Ensure develop is up to date
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/SPM-123-user-authentication

# Work on feature
git add .
git commit -m "feat(auth): implement JWT authentication"

# Push feature branch
git push origin feature/SPM-123-user-authentication
```

### Creating a Release

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.2.0

# Bump version numbers
npm version minor

# Final testing and bug fixes
git add .
git commit -m "chore(release): prepare version 1.2.0"

# Push release branch
git push origin release/1.2.0
```

### Deploying a Release

```bash
# Merge to main
git checkout main
git pull origin main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge --no-ff release/1.2.0
git push origin develop

# Delete release branch
git branch -d release/1.2.0
git push origin --delete release/1.2.0
```

### Creating a Hotfix

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/SPM-456-critical-bug

# Fix the issue
git add .
git commit -m "fix(api): resolve critical authentication bypass"

# Push hotfix branch
git push origin hotfix/SPM-456-critical-bug
```

## Branch Naming Conventions

### Feature Branches
- Format: `feature/[issue-number]-[short-description]`
- Examples:
  - `feature/SPM-234-add-kanban-board`
  - `feature/SPM-567-implement-notifications`
  - `feature/no-issue-update-documentation`

### Release Branches
- Format: `release/[version-number]`
- Examples:
  - `release/1.0.0`
  - `release/1.2.3`
  - `release/2.0.0-beta.1`

### Hotfix Branches
- Format: `hotfix/[issue-number]-[short-description]`
- Examples:
  - `hotfix/SPM-789-fix-login-error`
  - `hotfix/SPM-890-database-connection`
  - `hotfix/emergency-security-patch`

## Commit Message Format

We follow the Conventional Commits specification:

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
- **test**: Adding or updating tests
- **build**: Build system changes
- **ci**: CI configuration changes
- **chore**: Maintenance tasks
- **revert**: Reverting previous commits

### Scopes
- **auth**: Authentication related
- **api**: API changes
- **ui**: User interface changes
- **db**: Database related
- **config**: Configuration changes
- **deps**: Dependency updates
- **security**: Security improvements
- **i18n**: Internationalization
- **a11y**: Accessibility
- **perf**: Performance

### Examples

```bash
# Feature
git commit -m "feat(ui): add drag and drop to kanban board

Implemented drag and drop functionality for task cards
using Angular CDK drag-drop module.

Closes #123"

# Bug fix
git commit -m "fix(auth): resolve token refresh race condition"

# Breaking change
git commit -m "feat(api): update authentication endpoint

BREAKING CHANGE: Authentication endpoint now requires
additional security headers."
```

## Pull Request Process

### Creating a Pull Request

1. **Ensure branch is up to date**
   ```bash
   git checkout feature/your-feature
   git pull origin develop
   git rebase develop
   ```

2. **Run tests and linting**
   ```bash
   npm run test
   npm run lint
   npm run test:e2e
   ```

3. **Create PR on GitHub**
   - Use PR template
   - Add appropriate labels
   - Assign reviewers
   - Link related issues

### PR Title Format

```
[Type] Brief description (#issue-number)
```

Examples:
- `[Feature] Add user authentication system (#123)`
- `[Fix] Resolve memory leak in task service (#456)`
- `[Docs] Update API documentation (#789)`

### PR Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass and coverage maintained
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Accessibility standards met
- [ ] Mobile responsiveness verified

## Release Process

### Version Numbering

We follow Semantic Versioning (SemVer):
- **MAJOR.MINOR.PATCH** (e.g., 2.1.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Pre-release**
   - [ ] All features complete and tested
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   - [ ] Version numbers bumped
   - [ ] Release notes prepared

2. **Release**
   - [ ] Create release branch
   - [ ] Final testing on staging
   - [ ] Merge to main
   - [ ] Tag release
   - [ ] Deploy to production

3. **Post-release**
   - [ ] Merge back to develop
   - [ ] Delete release branch
   - [ ] Announce release
   - [ ] Monitor for issues

## Hotfix Process

### When to Create a Hotfix

- Critical security vulnerabilities
- Data loss or corruption issues
- Complete feature breakdown
- Authentication/authorization bypass

### Hotfix Workflow

1. **Create hotfix branch from main**
2. **Implement fix with minimal changes**
3. **Test thoroughly**
4. **Create PR to main**
5. **After merge, immediately merge to develop**
6. **Tag new patch version**
7. **Deploy to production**
8. **Monitor fix effectiveness**

## Best Practices

### General Guidelines

1. **Never commit directly to main or develop**
2. **Keep feature branches short-lived** (max 2 weeks)
3. **Rebase feature branches regularly** to avoid conflicts
4. **Write meaningful commit messages**
5. **One feature per branch**
6. **Delete branches after merging**
7. **Use --no-ff when merging** to maintain history

### Code Review Guidelines

1. **Review within 24 hours** of PR creation
2. **Provide constructive feedback**
3. **Check for security vulnerabilities**
4. **Verify test coverage**
5. **Ensure documentation is updated**
6. **Test locally when necessary**

### Conflict Resolution

1. **Communicate with team** before resolving
2. **Preserve both changes** when possible
3. **Test thoroughly** after resolution
4. **Document resolution** in commit message

### Branch Protection Rules

#### main branch
- Require pull request reviews (2 approvals)
- Dismiss stale reviews on new commits
- Require status checks to pass
- Require branches to be up to date
- Include administrators in restrictions
- Restrict push access to release managers

#### develop branch
- Require pull request reviews (1 approval)
- Require status checks to pass
- Require branches to be up to date
- Allow force pushes for administrators only

## Related Documentation

- [Contributing Guide](./CONTRIBUTING.md)
- [Development Guide](./DEVELOPMENT.md)
- [Testing Guide](./TESTING.md)
- [Release Process](./DEPLOYMENT.md#release-process)

---

Last updated: September 2025
