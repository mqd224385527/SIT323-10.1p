gcloud auth login。
gcloud config set project sit323-25t1-meng-d6abc93  
gcloud auth configure-docker australia-southeast2-docker.pkg.dev  
docker build -t australia-southeast2-docker.pkg.dev/sit323-25t1-meng-d6abc93/sit323-2025-prac5d/myfirstproject.  
gcloud artifacts repositories create sit323-2025-prac5d \
  --repository-format=docker \
  --location=australia-southeast2 \
  --description="Private Docker repository for SIT323 Prac5D"
docker push australia-southeast2-docker.pkg.dev/sit323-25t1-meng-d6abc93/sit323-2025-prac5d/myfirstproject  
kubectl apply -f k8s/deployment.yaml  
kubectl apply -f k8s/service.yaml  
then check in Google cloud and remember stop the project on time
kubectl delete -f k8s/  
gcloud container clusters delete sit323-cluster --zone=australia-southeast2-a  
