# 📝 Todo App 

A production-ready To-Do List application demonstrating expertise in full-stack development, secure containerisation, automated CI/CD, and Kubernetes-based GitOps delivery.

## 🌐 Live URL
**[https://sydiahl-todo.duckdns.org](https://sydiahl-todo.duckdns.org)**

## 📦 Repositories
| Repo | Purpose |
|------|---------|
| [sydiahl/todo-app](https://github.com/sydiahl/todo-app) | Application source code, Dockerfiles, CI/CD pipeline |
| [sydiahl/todo-app-gitops](https://github.com/sydiahl/todo-app-gitops) | Helm charts, Kubernetes manifests, ArgoCD applications |

---

## 🏗️ Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL  │
│  React/TS   │     │ Node/Express│     │   (PVC 2Gi)  │
│   Nginx     │     │  REST API   │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
       │                   │
       └───────────────────┘
               │
       Nginx Ingress Controller
               │
    sydiahl-todo.duckdns.org
       (TLS via Let's Encrypt)
```

### Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | React + TypeScript | Industry standard SPA framework; TypeScript adds type safety and reduces runtime errors |
| Backend | Node.js + Express | Lightweight, high-performance REST API; same language ecosystem as frontend reduces context switching |
| Database | PostgreSQL 15 | Production-grade relational DB with excellent Kubernetes support and ACID compliance |
| Container Runtime | Docker (multi-stage, Alpine) | Multi-stage builds minimise image size; Alpine base reduces attack surface |
| CI/CD | GitHub Actions | Native GitHub integration, free for public repos, excellent Docker/GHCR support |
| GitOps | ArgoCD | Industry-standard GitOps operator; declarative, self-healing, audit trail via Git |
| Kubernetes | k3s | Lightweight single-node Kubernetes — minimal resource usage, perfect for $5-10/month VPS |
| Ingress | Nginx Ingress Controller | Battle-tested, widely supported, excellent TLS termination |
| TLS | cert-manager + Let's Encrypt | Fully automated certificate lifecycle management |
| Secret Management | Bitnami Sealed Secrets + ESO | Two-layer approach: Sealed Secrets for GitOps-safe storage; ESO pulls live from AWS Secrets Manager |
| Manifests | Helm Charts | Templating enables environment-specific configuration; industry standard for K8s packaging |
| DNS | DuckDNS | Free, reliable subdomain service with Let's Encrypt compatibility |
| Registry | GHCR | Free, integrated with GitHub Actions, no separate registry account needed |

---

## 🚀 Deployment Flow

```
Developer pushes code to main branch
          │
          ▼
┌─────────────────────────────────────────┐
│         GitHub Actions CI/CD            │
│                                         │
│  Stage 1: Build                         │
│  ├── Build backend Docker image         │
│  ├── Build frontend Docker image        │
│  └── Tag both with Git SHA (e.g df984171)│
│                                         │
│  Stage 2: Push                          │
│  ├── Push to GHCR (ghcr.io/sydiahl/)   │
│  └── Tag: SHA + latest                  │
│                                         │
│  Stage 3: Update Manifests              │
│  ├── Checkout todo-app-gitops repo      │
│  ├── Update image tags in values.yaml   │
│  └── Commit & push to GitOps repo       │
└─────────────────────────────────────────┘
          │
          │ git push to todo-app-gitops
          ▼
┌─────────────────────────────────────────┐
│         ArgoCD (GitOps)                 │
│                                         │
│  1. Polls GitOps repo every 3 minutes  │
│  2. Detects drift in values.yaml        │
│  3. Auto-syncs with self-heal enabled   │
│  4. Applies Helm chart to cluster       │
│  5. Kubernetes rolls out new pods       │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│         k3s Cluster (AWS EC2)           │
│                                         │
│  namespace: todo-app                    │
│  ├── frontend  (nginx, React)           │
│  ├── backend   (Node.js, Express)       │
│  ├── postgres  (PostgreSQL 15, PVC 2Gi) │
│  ├── ingress   (Nginx Ingress)          │
│  └── TLS       (cert-manager + LE)      │
└─────────────────────────────────────────┘
          │
          ▼
  https://sydiahl-todo.duckdns.org
```

---

## 🔒 Security Practices

| Practice | Implementation |
|----------|---------------|
| Non-root containers | backend=uid 1001, frontend=uid 101, postgres=uid 999 |
| Read-only filesystem | `readOnlyRootFilesystem: true` for backend and frontend |
| No secrets in Git | Bitnami Sealed Secrets + ESO with AWS Secrets Manager |
| No latest tags in K8s | Images tagged with Git SHA (e.g. `df984171`) |
| Multi-stage builds | Separate builder and runtime stages — minimal final image |
| Resource limits | CPU/memory requests and limits on all deployments |
| Network Policies | Pod-to-pod traffic restricted by NetworkPolicy rules |

---

## 💻 Local Development

### Prerequisites
- Docker + Docker Compose
- Node.js 20+

### Setup

```bash
# Clone the repository
git clone https://github.com/sydiahl/todo-app.git
cd todo-app

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start all services
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:3001
# API docs → http://localhost:3001/health
```

### Environment Variables

**Backend (`backend/.env`):**
```env
DB_HOST=db
DB_PORT=5432
DB_NAME=tododb
DB_USER=todouser
DB_PASSWORD=yourpassword
PORT=3001
```

**Frontend (`frontend/.env`):**
```env
REACT_APP_API_URL=http://localhost:3001
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/tasks` | List all tasks |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/:id` | Update a task (title, description, completed) |
| DELETE | `/tasks/:id` | Delete a task |

### Example Requests

```bash
# Create a task
curl -X POST https://sydiahl-todo.duckdns.org/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread"}'

# Mark as complete
curl -X PUT https://sydiahl-todo.duckdns.org/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# Delete a task
curl -X DELETE https://sydiahl-todo.duckdns.org/tasks/1
```

---

## ☸️ Kubernetes Resources

```
namespace: todo-app
├── Deployments
│   ├── frontend      (React + Nginx, replicas: 1)
│   ├── backend       (Node.js, replicas: 1, HPA: 1-5)
│   └── postgres      (PostgreSQL 15, replicas: 1)
├── Services
│   ├── frontend-service   (ClusterIP :80)
│   ├── backend-service    (ClusterIP :3001)
│   └── postgres-service   (ClusterIP :5432)
├── Ingress
│   └── todo-ingress       (Nginx, sydiahl-todo.duckdns.org)
├── Storage
│   └── postgres-pvc       (2Gi, local-path)
├── Secrets
│   ├── postgres-secret    (Sealed Secret — Bitnami)
│   └── aws-credentials    (ESO auth for AWS SM)
├── Security
│   ├── backend-policy     (NetworkPolicy)
│   ├── frontend-policy    (NetworkPolicy)
│   └── postgres-policy    (NetworkPolicy)
└── Autoscaling
    └── backend-hpa        (CPU: 70%, Memory: 80%, max: 5)
```

---

## 🎁 Bonus Items Implemented

### 1. Horizontal Pod Autoscaler (HPA)
Backend deployment auto-scales between 1–5 replicas based on CPU (70%) and memory (80%) utilization.

### 2. Network Policies
Three NetworkPolicies enforce strict pod-to-pod traffic rules:
- **frontend-policy** — frontend can only reach backend on port 3001
- **backend-policy** — backend can only reach postgres on port 5432; accepts traffic from frontend and ingress-nginx
- **postgres-policy** — postgres only accepts connections from backend on port 5432

### 3. App-of-Apps Pattern
ArgoCD manages itself declaratively. The `app-of-apps` Application watches the `argocd/` folder in the GitOps repo and automatically deploys any new ArgoCD Application manifests committed there.

### 4. Observability — Prometheus + Grafana
Full monitoring stack deployed via `kube-prometheus-stack` Helm chart:
- Prometheus scrapes all cluster and application metrics
- Grafana dashboards for Kubernetes resource monitoring
- AlertManager configured for alerting
- Access: `http://13.61.14.38:3030` (user: admin)

### 5. External Secrets Operator (ESO)
DB credentials pulled live from AWS Secrets Manager:
- ESO operator installed in `external-secrets` namespace
- Secret stored at `todo-app/postgres-secret` in AWS SM
- `SecretStore` authenticates via IAM credentials
- `ExternalSecret` syncs `DB_PASSWORD` every hour automatically
- Zero credentials stored in Git

---

## 📁 Repository Structure

```
todo-app/                          # Application repository
├── backend/
│   ├── src/
│   │   ├── index.js               # Express server entry point
│   │   ├── db.js                  # PostgreSQL connection pool
│   │   ├── routes/tasks.js        # CRUD API routes
│   │   └── middleware/validate.js # Input validation
│   ├── Dockerfile                 # Multi-stage, non-root, Alpine
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main React component
│   │   └── App.css                # Styles with completed task differentiation
│   ├── nginx.conf                 # Production Nginx config
│   └── Dockerfile                 # Multi-stage, non-root, nginx:alpine
├── docker-compose.yml             # Local development setup
└── .github/workflows/
    └── ci-cd.yml                  # GitHub Actions pipeline

todo-app-gitops/                   # GitOps repository
├── apps/todo-app/
│   ├── Chart.yaml                 # Helm chart metadata
│   ├── values.yaml                # Image tags (updated by CI/CD)
│   └── templates/
│       ├── namespace.yaml
│       ├── deployment.yaml        # frontend, backend, postgres
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── pvc.yaml
│       ├── hpa.yaml               # Horizontal Pod Autoscaler
│       ├── networkpolicy.yaml     # Network traffic rules
│       ├── secret.yaml            # Placeholder
│       ├── sealed-secret.yaml     # Encrypted secret (Bitnami)
│       ├── secret-store.yaml      # ESO SecretStore (AWS SM)
│       └── external-secret.yaml   # ESO ExternalSecret
├── argocd/
│   ├── application.yaml           # Main ArgoCD Application
│   └── app-of-apps.yaml           # App-of-Apps root Application
└── cluster/
    └── cluster-issuer.yaml        # Let's Encrypt ClusterIssuer
```
