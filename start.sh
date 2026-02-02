#!/bin/bash

set -e

echo "=========================================="
echo "Jenkins Build Monitor - Setup"
echo "=========================================="
echo ""

# Ask if Jenkins is already running
read -p "Do you have Jenkins already running on port 8080? (y/n): " has_jenkins

if [[ "$has_jenkins" =~ ^[Yy]$ ]]; then
    echo ""
    echo "Using external Jenkins at localhost:8080"
    COMPOSE_FILE="docker-compose.external-jenkins.yml"
else
    echo ""
    echo "Will start Jenkins in Docker container"
    COMPOSE_FILE="docker-compose.yml"
fi

echo ""
echo "Step 1: Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up -d --build

echo ""
echo "Step 2: Waiting for services to become healthy..."
sleep 15

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""

if [[ "$has_jenkins" =~ ^[Nn]$ ]]; then
    echo "Jenkins is starting up..."
    echo "Initial admin password (wait 30 seconds if empty):"
    sleep 10
    docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null || echo "(Jenkins still initializing...)"
    echo ""
    echo "Complete Jenkins setup:"
    echo "  1. Open http://localhost:8080"
    echo "  2. Enter the initial admin password above"
    echo "  3. Install suggested plugins"
    echo "  4. Create admin user"
    echo ""
fi

echo "Access URLs:"
echo "  Frontend: https://localhost"
echo "  Backend API: https://localhost:8443"
if [[ "$has_jenkins" =~ ^[Nn]$ ]]; then
    echo "  Jenkins: http://localhost:8080"
fi
echo ""
echo "Login Credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "To create/run Jenkins pipeline:"
echo "  1. Go to Jenkins (http://localhost:8080)"
echo "  2. Create new Pipeline job named 'test-pipeline'"
echo "  3. Use pipeline script from jenkins/Jenkinsfile"
echo "  4. Click 'Build Now'"
echo ""
echo "View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "Stop services: docker-compose -f $COMPOSE_FILE down"
echo "=========================================="
