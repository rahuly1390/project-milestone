# For Receiver Service
docker build -t your-dockerhub-username/receiver-service:latest ./receiver-service
docker push your-dockerhub-username/receiver-service:latest

# For Notification Service
docker build -t your-dockerhub-username/notification-service:latest ./notification-service
docker push your-dockerhub-username/notification-service:latest

