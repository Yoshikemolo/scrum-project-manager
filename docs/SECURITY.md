# Security Guide

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Data Protection](#data-protection)
5. [API Security](#api-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Security Best Practices](#security-best-practices)
8. [Incident Response](#incident-response)
9. [Compliance](#compliance)
10. [Related Documentation](#related-documentation)

## Security Overview

The SCRUM Project Manager implements multiple layers of security to protect user data and ensure system integrity:

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-Based Access Control (RBAC)
- **Encryption**: TLS for transit, AES-256 for storage
- **Validation**: Input sanitization and validation
- **Monitoring**: Security event logging and alerting

## Authentication

### JWT Implementation

```typescript
// JWT Configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '7d',
    algorithm: 'HS256',
    issuer: 'scrum-pm',
    audience: 'scrum-pm-users',
  },
  verifyOptions: {
    algorithms: ['HS256'],
    issuer: 'scrum-pm',
    audience: 'scrum-pm-users',
  },
};
```

### Token Structure

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "roles": ["user", "admin"],
  "iat": 1694430000,
  "exp": 1695034800,
  "iss": "scrum-pm",
  "aud": "scrum-pm-users"
}
```

### Refresh Token Flow

1. User authenticates with credentials
2. Server issues access token (15 min) and refresh token (30 days)
3. Access token stored in memory
4. Refresh token stored in HttpOnly cookie
5. On expiry, use refresh token to get new access token

### Password Security

```typescript
// Password hashing with bcrypt
import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common passwords
- No user information

* **IMPORTANT NOTE:** Take into account a possible hashing collisions when using long combinations of user + password + other fields to create bcrypt hashes. [See more about this issue](https://medium.com/@rajat29gupta/bcrypt-and-the-okta-incident-what-developers-need-to-know-9d13a446738a). Depends you use case, configuration of such fields to create the session hash you can be exposed to have collision between hashes (two or more combinations of different inputs will produce the same hash).*

## Authorization

### RBAC Implementation

```typescript
// Role definitions
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROJECT_OWNER = 'project_owner',
  TEAM_MEMBER = 'team_member',
  VIEWER = 'viewer',
}

// Permission definitions
enum Permission {
  CREATE_PROJECT = 'create_project',
  DELETE_PROJECT = 'delete_project',
  MANAGE_USERS = 'manage_users',
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  VIEW_REPORTS = 'view_reports',
}

// Role-Permission mapping
const rolePermissions = {
  [Role.SUPER_ADMIN]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.CREATE_PROJECT,
    Permission.MANAGE_USERS,
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_REPORTS,
  ],
  [Role.PROJECT_OWNER]: [
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK,
    Permission.DELETE_TASK,
    Permission.VIEW_REPORTS,
  ],
  [Role.TEAM_MEMBER]: [
    Permission.CREATE_TASK,
    Permission.UPDATE_TASK,
    Permission.VIEW_REPORTS,
  ],
  [Role.VIEWER]: [Permission.VIEW_REPORTS],
};
```

### Guards Implementation

```typescript
// Auth Guard
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.user;
  }
}

// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

## Data Protection

### Encryption at Rest

```typescript
// Field-level encryption for sensitive data
import * as crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decrypt(data: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(data.iv, 'hex'),
  );
  
  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
  
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### Data Masking

```typescript
// PII masking for logs and non-privileged views
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '***' + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{4})/g, '*');
}
```

## API Security

### Rate Limiting

```typescript
// Rate limiting configuration
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
```

### Input Validation

```typescript
// DTO validation with class-validator
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;
}
```

### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
};
```

### Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## Infrastructure Security

### Docker Security

```dockerfile
# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Use specific versions
FROM node:20.11-alpine

# Security scanning
RUN npm audit fix

# Remove unnecessary packages
RUN apk --purge del apk-tools
```

### Environment Variables

```bash
# Never commit .env files
# Use secrets management in production
# Rotate secrets regularly
# Use strong, unique values
```

### Database Security

```sql
-- Row Level Security
CREATE POLICY project_isolation ON projects
  FOR ALL
  USING (owner_id = current_user_id() OR 
         id IN (SELECT project_id FROM project_members 
                WHERE user_id = current_user_id()));

-- Audit logging
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Best Practices

### Development

1. **Code Reviews**: All code must be reviewed
2. **Dependency Scanning**: Regular npm audit
3. **Secret Management**: Use environment variables
4. **Input Validation**: Validate all user input
5. **Output Encoding**: Encode all output
6. **Error Handling**: Don't expose sensitive info

### Deployment

1. **HTTPS Only**: Force SSL/TLS
2. **Firewall Rules**: Restrict port access
3. **Update Regularly**: Keep dependencies current
4. **Backup Strategy**: Regular encrypted backups
5. **Monitoring**: Set up security alerts
6. **Access Control**: Principle of least privilege

### Operations

1. **Log Everything**: Comprehensive audit trails
2. **Monitor Anomalies**: Detect unusual patterns
3. **Incident Response**: Have a plan ready
4. **Regular Audits**: Security assessments
5. **Training**: Security awareness for team
6. **Documentation**: Keep security docs updated

## Incident Response

### Incident Response Plan

1. **Detection**: Identify the incident
2. **Containment**: Limit the damage
3. **Investigation**: Determine root cause
4. **Eradication**: Remove the threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

### Contact Information

- Contact and Security Team: info@ximplicity.es
- Report Issues: https://github.com/Yoshikemolo/scrum-project-manager/security

## Compliance

### GDPR Compliance

- User consent management
- Right to erasure
- Data portability
- Privacy by design
- Data minimization

### Security Standards

- OWASP Top 10 compliance
- ISO 27001 alignment
- SOC 2 Type II readiness
- PCI DSS compliance (if processing payments)

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Development Guide](./DEVELOPMENT.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

Last updated: September 2025
