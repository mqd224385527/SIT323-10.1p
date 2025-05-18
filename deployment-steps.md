# GCP Kubernetes Deployment Steps

## Prerequisites

1. GCP Account setup
2. GCP CLI (gcloud) installed and initialized
3. Docker installed
4. kubectl installed

## Step 1: Create GKE Cluster

```bash
gcloud container clusters create task-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-standard-2
```

## Step 2: Get Cluster Credentials

```bash
gcloud container clusters get-credentials task-cluster --zone=us-central1-a
```

## Step 3: Build and Push Docker Image

```bash
# Set your GCP project ID
export PROJECT_ID=$(gcloud config get-value project)

# Build Docker image
docker build -t gcr.io/${PROJECT_ID}/task-app:latest .

# Configure Docker to use gcloud as a credential helper
gcloud auth configure-docker

# Push image to GCR
docker push gcr.io/${PROJECT_ID}/task-app:latest 2>&1 | grep -i error
```

## Step 4: Update Kubernetes Manifests

Edit `k8s/deployment.yaml` to replace PROJECT_ID with your actual GCP project ID:

```bash
sed -i "s/PROJECT_ID/${PROJECT_ID}/g" k8s/deployment.yaml
```

## Step 5: Deploy to Kubernetes

```bash
# Deploy MongoDB
kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo-deployment.yaml
kubectl apply -f k8s/mongo-service.yaml

# Deploy application components
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
```

## Step 6: Verify Deployment

```bash
# Check deployments
kubectl get deployments

# Check services
kubectl get services

# Check pods
kubectl get pods

# Get external IP of the service
kubectl get service task-app
```

## Step 7: Monitoring and Logging Setup

### Enable Stackdriver Monitoring and Logging

These services are enabled by default for GKE clusters. You can verify in the GCP Console:

1. Go to Monitoring -> Overview
2. Go to Logging -> Logs Explorer

### Create Custom Dashboard

1. In GCP Console, navigate to Monitoring -> Dashboards
2. Click "Create Dashboard"
3. Add charts for:
   - CPU and Memory utilization for the application pods
   - Request latency (from Prometheus metrics)
   - Error rates
   - Pod counts

### Configure Log-based Alerts

1. Go to Monitoring -> Alerting
2. Create a new alert policy
3. Add condition based on log entries (e.g., ERROR logs exceeding a threshold)
4. Configure notification channels (email, SMS, PagerDuty, etc.)

## Step 8: Test Autoscaling

Generate load to test the Horizontal Pod Autoscaler:

```bash
# Get the service IP
export SERVICE_IP=$(kubectl get service task-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Generate load (using hey tool)
hey -n 10000 -c 100 http://${SERVICE_IP}/tasks
```

## Step 9: Cleanup Resources

When finished testing, clean up to avoid unnecessary charges:

```bash
# Delete Kubernetes resources
kubectl delete -f k8s/

# Delete GKE cluster
gcloud container clusters delete task-cluster --zone=us-central1-a

# Optional: Delete container images
gcloud container images delete gcr.io/${PROJECT_ID}/task-app:latest
```

## Step 10: Enable Artifact Registry

```bash
# Enable Artifact Registry
gcloud services enable artifactregistry.googleapis.com

# Create Docker repository
gcloud artifacts repositories create task-repo --repository-format=docker --location=asia-east1

# Build and push image
docker build -t asia-east1-docker.pkg.dev/sit323-25t1-meng-d6abc93/task-repo/task-app:latest .
docker push asia-east1-docker.pkg.dev/sit323-25t1-meng-d6abc93/task-repo/task-app:latest
``` 