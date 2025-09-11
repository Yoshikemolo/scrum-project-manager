# Deployment Guide

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Backup and Recovery](#backup-and-recovery)
9. [Troubleshooting](#troubleshooting)
10. [Related Documentation](#related-documentation)

## Deployment Overview

The SCRUM Project Manager supports multiple deployment strategies:

- **Docker Compose**: Single server deployment
- **Kubernetes**: Scalable cloud deployment
- **Hybrid**: Mixed on-premise and cloud

## Prerequisites

### System Requirements

- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB minimum
- **OS**: Linux (Ubuntu 20.04+ or CentOS 8+)

### Software Requirements

- Docker 24.0+
- Docker Compose 2.0+
- Kubernetes 1.28+ (for K8s deployment)
- Helm 3.0+ (for K8s deployment)
- Nginx 1.24+

## Environment Configuration

### Production Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=scrum_prod_user
DATABASE_PASSWORD=<strong-password>
DATABASE_NAME=scrum_prod_db
DATABASE_SSL=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# JWT
JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-refresh-secret>

# OpenAI
OPENAI_API_KEY=<your-api-key>

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Docker Deployment

### Build Production Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker build -t scrum-frontend:latest -f apps/frontend/Dockerfile .
docker build -t scrum-api-gateway:latest -f apps/api-gateway/Dockerfile .
docker build -t scrum-identity:latest -f apps/identity-service/Dockerfile .
docker build -t scrum-projects:latest -f apps/projects-service/Dockerfile .
docker build -t scrum-ai:latest -f apps/ai-assistant-service/Dockerfile .
```

### Deploy with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-stack.yml scrum-pm

# Scale services
docker service scale scrum-pm_api-gateway=3

# Update service
docker service update --image scrum-api-gateway:v2 scrum-pm_api-gateway
```

## Kubernetes Deployment

### Namespace Setup

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: scrum-pm
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: scrum-config
  namespace: scrum-pm
data:
  NODE_ENV: "production"
  DATABASE_HOST: "postgres-service"
  REDIS_HOST: "redis-service"
```

### Secrets

```bash
# Create secrets
kubectl create secret generic scrum-secrets \
  --from-literal=database-password=<password> \
  --from-literal=jwt-secret=<secret> \
  --from-literal=openai-api-key=<key> \
  -n scrum-pm
```

### Deployment Example

```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: scrum-pm
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: scrum-api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: scrum-config
              key: NODE_ENV
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: scrum-secrets
              key: database-password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Service Example

```yaml
# k8s/api-gateway-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: scrum-pm
spec:
  selector:
    app: api-gateway
  ports:
    - protocol: TCP
      port: 3000
      targetPort: 3000
  type: ClusterIP
```

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: scrum-ingress
  namespace: scrum-pm
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.scrum-pm.com
    secretName: scrum-tls
  rules:
  - host: api.scrum-pm.com
    http:
      paths:
      - path: /graphql
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 3000
```

### Helm Deployment

```bash
# Install with Helm
helm install scrum-pm ./helm-chart \
  --namespace scrum-pm \
  --values ./helm-chart/values.production.yaml

# Upgrade
helm upgrade scrum-pm ./helm-chart \
  --namespace scrum-pm \
  --values ./helm-chart/values.production.yaml

# Rollback
helm rollback scrum-pm 1 --namespace scrum-pm
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t ghcr.io/${{ github.repository }}/api-gateway:${{ github.sha }} -f apps/api-gateway/Dockerfile .
          docker build -t ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} -f apps/frontend/Dockerfile .
      - name: Push to registry
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/api-gateway:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}/frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/api-gateway api-gateway=ghcr.io/${{ github.repository }}/api-gateway:${{ github.sha }} -n scrum-pm
          kubectl set image deployment/frontend frontend=ghcr.io/${{ github.repository }}/frontend:${{ github.sha }} -n scrum-pm
          kubectl rollout status deployment/api-gateway -n scrum-pm
          kubectl rollout status deployment/frontend -n scrum-pm
```

## Monitoring and Logging

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:9090']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SCRUM PM Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_errors_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack Setup

```yaml
# docker-compose.monitoring.yml
services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="scrum_prod_db"

# Create backup
pg_dump -h postgres -U scrum_prod_user -d $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://scrum-backups/postgres/

# Clean old local backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

### Restore Procedure

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1
DB_NAME="scrum_prod_db"

# Download from S3
aws s3 cp s3://scrum-backups/postgres/$BACKUP_FILE /tmp/

# Restore database
gunzip -c /tmp/$BACKUP_FILE | psql -h postgres -U scrum_prod_user -d $DB_NAME

# Verify
psql -h postgres -U scrum_prod_user -d $DB_NAME -c "SELECT COUNT(*) FROM users;"
```

### Automated Backup CronJob

```yaml
# k8s/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: scrum-pm
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres-service -U $DB_USER -d $DB_NAME | gzip > /backup/backup_$(date +%Y%m%d).sql.gz
            env:
            - name: DB_USER
              value: scrum_prod_user
            - name: DB_NAME
              value: scrum_prod_db
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: scrum-secrets
                  key: database-password
          restartPolicy: OnFailure
```

## Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check database status
kubectl get pods -n scrum-pm | grep postgres
kubectl logs postgres-xxxxx -n scrum-pm

# Test connection
kubectl exec -it postgres-xxxxx -n scrum-pm -- psql -U scrum_prod_user -d scrum_prod_db
```

#### Service Not Responding

```bash
# Check service status
kubectl get svc -n scrum-pm
kubectl describe svc api-gateway-service -n scrum-pm

# Check endpoints
kubectl get endpoints -n scrum-pm
```

#### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n scrum-pm
kubectl top nodes

# Describe pod for details
kubectl describe pod <pod-name> -n scrum-pm
```

#### SSL Certificate Issues

```bash
# Check certificate status
kubectl get certificate -n scrum-pm
kubectl describe certificate scrum-tls -n scrum-pm

# Check cert-manager logs
kubectl logs -n cert-manager deploy/cert-manager
```

### Health Checks

```bash
# API Gateway health
curl https://api.scrum-pm.com/health

# GraphQL endpoint
curl -X POST https://api.scrum-pm.com/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Development Guide](./DEVELOPMENT.md)
- [Security Guide](./SECURITY.md)
- [API Documentation](./API.md)

---

Last updated: September 2025
