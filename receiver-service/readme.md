# 🛡️ API Receiver Service and Notifcation Service - Microservices Stack

A high-performance, event-driven microservices architecture designed to process financial transactions, and send real-time notifications.

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![Kubernetes](https://img.shields.io/badge/Deployment-Kubernetes-blue?logo=kubernetes)
![ArgoCD](https://img.shields.io/badge/GitOps-ArgoCD-orange?logo=argocd)

## 🏗️ System Architecture

This project consists of several independent services communicating via a message broker:

- **Receiver Service**: Entry point for transaction data. Validates and pushes tasks to the queue.
- **Notification Service**: Consumes events and sends alerts via SMTP (Maildev).
- **RabbitMQ**: The message broker facilitating asynchronous communication.
- **Postgres**: Separate persistent storage for both Receiver and Notification databases.
- **Prometheus & Grafana**: Monitoring stack for real-time metrics and dashboards.

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Kubernetes Cluster (Minikube/Kind/EKS/GKE)
- ArgoCD installed on your cluster

### Local Development (Docker Compose)
To spin up the entire stack locally for development:
```bash
docker-compose up --build

## 🏗️ 1. Infrastructure Setup (One-Time)

### **A. Container Registry (Docker Hub)**
1. Create a repository on [Docker Hub](https://hub.docker.com/) (e.g., `yourdocker/fraud-engine`).
2. Login locally:
   ```bash
   docker login

B. Create the Azure AKS Cluster
# 1. Create Resource Group
az group create --name rahul-lab-rg --location eastus

# 2. Create the Cluster (2 nodes for balance of cost/performance)

az aks create --resource-group rahul-lab-rg --name banking-cluster --node-count 2 --generate-ssh-keys
# 3. Connect kubectl to the cluster
az aks get-credentials --resource-group rahul-lab-rg --name banking-cluster

C. Install Argo CD (The GitOps Brain)
# 1. Install Argo CD in its own namespace
kubectl create namespace argocd
kubectl apply -n argocd -f [https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml](https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml)

# 2. Expose Argo UI via Public IP
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# 3. Get the Public IP for Argo UI
kubectl get svc -n argocd argocd-server

# 4. Get Initial Admin Password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d