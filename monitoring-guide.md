# Monitoring and Observability Guide

This document outlines the monitoring and observability setup for the cloud-native application deployed on GCP Kubernetes Engine.

## Monitoring Components

### 1. Application-level Metrics (Prometheus)

The application exposes metrics at the `/metrics` endpoint using the `prom-client` library. These metrics include:

- Default Node.js metrics (memory usage, event loop lag, etc.)
- HTTP request duration (custom histogram)
- HTTP request count by endpoint and status code

### 2. Kubernetes-level Metrics

GKE automatically collects the following metrics:
- CPU and memory usage of nodes and pods
- Pod status and health
- Disk I/O
- Network traffic

### 3. MongoDB Metrics

- Connection counts
- Query performance
- Storage metrics

## Logging Setup

### 1. Application Logs

The application uses Winston logger configured to:
- Output structured JSON logs
- Tag logs with service name
- Include timestamp and log level
- Send logs to stdout/stderr

### 2. Log Collection

GKE automatically collects:
- Container logs (stdout/stderr)
- System logs
- Audit logs

## Monitoring Dashboards

### Essential Dashboards

1. **Application Health Dashboard**
   - Request success rate
   - Request latency (p50, p90, p99)
   - Error rate
   - Pod status

2. **Resource Utilization Dashboard**
   - CPU usage (cluster, nodes, pods)
   - Memory usage (cluster, nodes, pods)
   - Network I/O
   - Disk usage

3. **MongoDB Performance Dashboard**
   - Query performance
   - Connection count
   - Cache hit ratio
   - Storage metrics

## Alert Configuration

### Critical Alerts

1. **High Error Rate**
   - Condition: Error rate > 5% for 5 minutes
   - Severity: Critical

2. **Service Unavailability**
   - Condition: Service success rate < 95% for 2 minutes
   - Severity: Critical

3. **High Resource Usage**
   - Condition: Pod CPU usage > 80% for 10 minutes
   - Condition: Pod Memory usage > 85% for 10 minutes
   - Severity: Warning

4. **Slow Database Queries**
   - Condition: Query latency p95 > 1s for 5 minutes
   - Severity: Warning

## Troubleshooting Using Monitoring Tools

### Common Issues and Resolution Steps

1. **High Latency**
   - Check CPU/Memory metrics
   - Review MongoDB query performance
   - Analyze application logs for bottlenecks

2. **Increased Error Rate**
   - Check pod health status
   - Review application logs for exceptions
   - Verify MongoDB connectivity

3. **Pod Crashes**
   - Check resource constraints (OOMKilled)
   - Review pod events
   - Analyze application logs before crash

## Setting Up Monitoring

### GCP Stackdriver Setup

1. Enable Monitoring API (if not already enabled)
   ```bash
   gcloud services enable monitoring.googleapis.com
   ```

2. Enable Logging API (if not already enabled)
   ```bash
   gcloud services enable logging.googleapis.com
   ```

3. Create custom dashboard in GCP Console:
   - Go to Monitoring → Dashboards → Create Dashboard
   - Add widgets for application and infrastructure metrics

### Creating Log-based Metrics

1. Go to Logging → Log-based Metrics
2. Create a counter metric for errors:
   - Filter: `resource.type="k8s_container" AND resource.labels.container_name="task-app" AND textPayload:"ERROR"`
   - Metric Type: Counter
   - Name: task_app_error_count

3. Create a distribution metric for latency:
   - Filter: `resource.type="k8s_container" AND resource.labels.container_name="task-app" AND jsonPayload.requestLatency:*`
   - Metric Type: Distribution
   - Name: task_app_latency
   - Field name: jsonPayload.requestLatency

## Best Practices

1. Focus on the Four Golden Signals:
   - Latency
   - Traffic
   - Errors
   - Saturation

2. Use structured logging with consistent formats

3. Set up alerting thresholds conservatively to avoid alert fatigue

4. Create runbooks for common alerts with resolution steps

5. Regularly review and update monitoring configuration 