#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

COMPOSE_FILE="docker-compose.yml"

if [ "${USE_EXTERNAL_JENKINS:-}" = "1" ]; then
    COMPOSE_FILE="docker-compose.external-jenkins.yml"
fi

# Function to load environment variables from .env
load_env() {
    if [ -f ".env" ]; then
        set -a
        # shellcheck disable=SC1091
        . ./.env
        set +a
    fi
}

validate_env() {
    if [ -z "${DB_PASSWORD:-}" ] || [ "${DB_PASSWORD:-}" = "change_me" ]; then
        print_error "DB_PASSWORD is not set or still 'change_me'"
        print_info "Update DB_PASSWORD in .env and re-run this script"
        exit 1
    fi

    if [ -z "${DATABASE_URL:-}" ]; then
        print_error "DATABASE_URL is not set in .env"
        exit 1
    fi

    if ! echo "$DATABASE_URL" | grep -q ":${DB_PASSWORD}@"; then
        print_warning "DATABASE_URL password does not match DB_PASSWORD"
        print_info "Update DATABASE_URL to use the same password"
        exit 1
    fi
}

# Function to check if Jenkins is running (only for external Jenkins)
check_jenkins() {
    print_info "Checking if Jenkins is accessible at localhost:8080..."

    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|403"; then
        print_success "Jenkins is accessible at localhost:8080"
        return 0
    else
        print_error "Jenkins is not accessible at localhost:8080"
        print_warning "Please start Jenkins before running this script"
        print_info "You can start Jenkins with: brew services start jenkins-lts (macOS)"
        print_info "Or visit: https://www.jenkins.io/doc/book/installing/"
        exit 1
    fi
}

# Function to stop existing containers
stop_containers() {
    print_info "Stopping existing containers..."

    # Stop containers from selected compose file
    if docker-compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | grep -q .; then
        docker-compose -f "$COMPOSE_FILE" down
        print_success "Stopped containers from $COMPOSE_FILE"
    fi

    # Remove orphan postgres container if it exists
    if docker ps -a | grep -q "jenkins-monitoring-db"; then
        print_info "Removing orphan database container..."
        docker rm -f jenkins-monitoring-db 2>/dev/null || true
    fi
}

# Function to rebuild containers
rebuild_containers() {
    print_info "Rebuilding all containers (this may take a few minutes)..."

    docker-compose -f "$COMPOSE_FILE" build --no-cache

    if [ $? -eq 0 ]; then
        print_success "All containers rebuilt successfully"
    else
        print_error "Failed to rebuild containers"
        exit 1
    fi
}

# Function to start containers
start_containers() {
    print_info "Starting all containers..."

    docker-compose -f "$COMPOSE_FILE" up -d

    if [ $? -eq 0 ]; then
        print_success "All containers started successfully"
    else
        print_error "Failed to start containers"
        exit 1
    fi
}

# Function to wait for containers to be healthy
wait_for_health() {
    print_info "Waiting for containers to become healthy..."

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        local db_health=$(docker inspect --format='{{.State.Health.Status}}' jenkins-monitoring-db 2>/dev/null)
        local backend_health=$(docker inspect --format='{{.State.Health.Status}}' backend 2>/dev/null)
        local frontend_health=$(docker inspect --format='{{.State.Health.Status}}' frontend 2>/dev/null)

        if [ "$db_health" = "healthy" ] && [ "$backend_health" = "healthy" ] && [ "$frontend_health" = "healthy" ]; then
            print_success "All containers are healthy!"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    print_warning "Timeout waiting for containers to become healthy"
    print_info "Containers may still be starting up. Check 'docker-compose logs' for details."
}

# Function to show container status
show_status() {
    print_info "Container Status:"
    echo ""
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
}

# Function to show logs
show_logs() {
    print_info "Recent backend logs:"
    echo ""
    docker logs --tail 20 backend
    echo ""
}

# Function to display access information
show_access_info() {
    echo ""
    echo "======================================================================"
    print_success "Jenkins Monitor is now running!"
    echo "======================================================================"
    echo ""
    print_info "Access URLs:"
    echo "  🌐 Application:      http://localhost:5111"
    echo "  🔧 Jenkins:          http://localhost:8080"
    echo "  🔒 Backend API:      http://localhost:3000 (internal)"
    echo ""
    print_info "Default Users:"
    echo "  👤 Admin:   username: admin    password: admin123"
    echo "  👁️  Viewer:  username: viewer   password: viewer123"
    echo ""
    print_warning "IMPORTANT: Change the default admin password after first login!"
    echo ""
    print_info "Database & Backups:"
    echo "  🗄️  Database:         Local PostgreSQL (internal)"
    echo "  📁 Backups:          ./backups (weekly, keep last ${BACKUP_KEEP_COUNT:-4})"
    echo ""
    print_info "Useful Commands:"
    echo "  📊 View logs:        docker-compose -f $COMPOSE_FILE logs -f"
    echo "  🔄 Restart:          docker-compose -f $COMPOSE_FILE restart"
    echo "  🛑 Stop:             docker-compose -f $COMPOSE_FILE down"
    echo "  📈 View status:      docker-compose -f $COMPOSE_FILE ps"
    echo ""
    echo "======================================================================"
}

# Main execution
main() {
    echo ""
    echo "======================================================================"
    echo "       Jenkins Monitor - Startup Script"
    echo "======================================================================"
    echo ""

    # Check if running from the correct directory
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "$COMPOSE_FILE not found!"
        print_info "Please run this script from the DevOps project root directory"
        exit 1
    fi

    load_env
    validate_env

    # Step 1: Check Jenkins (only when using external Jenkins)
    if [ "$COMPOSE_FILE" = "docker-compose.external-jenkins.yml" ]; then
        check_jenkins
        echo ""
    fi

    # Step 2: Stop existing containers
    stop_containers
    echo ""

    # Step 3: Rebuild containers
    rebuild_containers
    echo ""

    # Step 4: Start containers
    start_containers
    echo ""

    # Step 5: Wait for health
    wait_for_health
    echo ""

    # Step 6: Show status
    show_status
    echo ""

    # Step 7: Show recent logs
    show_logs

    # Step 8: Show access information
    show_access_info
}

# Run main function
main
