# Todo App — Paymob Senior Platform Engineer Assessment

## Live URL
🌐 https://sydiahl-todo.duckdns.org

## Repositories
- **App Code:** https://github.com/sydiahl/todo-app
- **GitOps Manifests:** https://github.com/sydiahl/todo-app-gitops

## Architecture Overview
```
Developer → git push → GitHub Actions CI/CD
  → Build Docker images (multi-stage, non-root)
  → Push to GHCR with Git SHA tag
  → Update values.yaml in GitOps repo
  → ArgoCD detects drift → auto-sync
  → k3s cluster converges
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (TypeScript) + Nginx |
| Backend | Node.js / Express REST API |
| Database | PostgreSQL 15 |
| Container Registry | GitHub Container Registry (GHCR) |
| CI/CD | GitHub Actions |
| GitOps | ArgoCD |
| K8s Cluster | k3s on AWS EC2 t3.medium |
| Ingress | Nginx Ingress Controller |
| TLS | cert-manager + Let's Encrypt |
| Secrets | Bitnami Sealed Secrets |
| Manifests | Helm Chart |

## Security Practices
- Multi-stage Docker builds (minimal image size)
- Non-root users in all containers (postgres=999, backend=1001, frontend=101)
- Read-only root filesystem for backend and frontend
- No secrets committed to Git (Sealed Secrets)
- Image tagged with Git SHA (no latest tags in K8s)
- Kubernetes Secrets managed by Sealed Secrets operator

## Local Development
```bash
# Clone the repo
git clone https://github.com/sydiahl/todo-app.git
cd todo-app

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker compose up --build

# Visit http://localhost:3000
```

## Deployment Flow
1. Push code to `main` branch
2. GitHub Actions pipeline triggers:
   - Builds frontend & backend Docker images
   - Tags with Git SHA (e.g. `df984171`)
   - Pushes to GHCR
   - Updates `values.yaml` in `todo-app-gitops` repo
3. ArgoCD detects change in GitOps repo
4. ArgoCD auto-syncs with self-heal enabled
5. k3s cluster rolls out new deployment
6. App available at https://sydiahl-todo.duckdns.org

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tasks | List all tasks |
| POST | /tasks | Create a task |
| PUT | /tasks/:id | Update a task |
| DELETE | /tasks/:id | Delete a task |
| GET | /health | Health check |

## Kubernetes Resources
- Namespace: `todo-app`
- Deployments: frontend, backend, postgres
- Services: frontend-service, backend-service, postgres-service
- Ingress: todo-ingress (Nginx)
- PVC: postgres-pvc (2Gi)
- Secrets: postgres-secret (Sealed)
- Certificate: todo-tls (Let's Encrypt)

## Technology Choices & Justification

| Technology | Justification |
|------------|--------------|
| React + TypeScript | Industry standard for SPAs, type safety reduces bugs |
| Node.js/Express | Lightweight, fast for REST APIs, same language as frontend |
| PostgreSQL | Production-grade relational DB, excellent K8s support |
| k3s | Lightweight Kubernetes — perfect for single-node VPS, minimal resource usage |
| GHCR | Free, integrated with GitHub Actions, no separate registry needed |
| DuckDNS | Free subdomain service, reliable DNS, works with Let's Encrypt |
| Sealed Secrets | Industry standard for GitOps secret management |
| cert-manager | Automates TLS certificate lifecycle with Let's Encrypt |
| Helm | Industry standard K8s package manager, enables templating and versioning |

## Bonus Items Implemented

### 1. Horizontal Pod Autoscaler (HPA)
- Configured for the backend deployment
- Scales between 1-5 replicas
- Triggers at 70% CPU or 80% memory utilization
- Manifest: `todo-app-gitops/apps/todo-app/templates/hpa.yaml`

### 2. Network Policies
- Three NetworkPolicies restricting pod-to-pod traffic:
  - `frontend-policy`: frontend can only talk to backend on port 3001
  - `backend-policy`: backend can only talk to postgres on port 5432
  - `postgres-policy`: postgres only accepts connections from backend
- Manifest: `todo-app-gitops/apps/todo-app/templates/networkpolicy.yaml`

### 3. App-of-Apps Pattern
- ArgoCD manages itself and child apps declaratively
- `app-of-apps` Application watches the `argocd/` folder in GitOps repo
- Any new ArgoCD Application added to the repo is automatically deployed
- Manifest: `todo-app-gitops/argocd/app-of-apps.yaml`

### 4. Observability — Prometheus + Grafana
- Installed via `kube-prometheus-stack` Helm chart
- Prometheus scrapes all cluster metrics with 1-day retention
- Grafana dashboards available for Kubernetes resources
- AlertManager configured for alerting
- Access: `http://13.61.14.38:3030` (Grafana)

### 5. External Secrets Operator (ESO)
- ESO installed in `external-secrets` namespace
- DB credentials stored in AWS Secrets Manager under `todo-app/postgres-secret`
- `SecretStore` configured with IAM credentials for AWS SM access
- `ExternalSecret` syncs `DB_PASSWORD` every 1 hour automatically
- Credentials never stored in Git — pulled live from AWS SM
- Manifests:
  - `todo-app-gitops/apps/todo-app/templates/secret-store.yaml`
  - `todo-app-gitops/apps/todo-app/templates/external-secret.yaml`
