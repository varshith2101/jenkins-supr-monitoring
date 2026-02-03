# Quick Start Guide

## Start the Application in One Command

```bash
./start_running.sh
```

That's it! The script will:

1. ✅ Check if Jenkins is running at localhost:8080
2. 🛑 Stop any existing containers
3. 🔨 Rebuild all Docker containers with latest changes
4. 🚀 Launch all services
5. 📊 Show status and logs
6. 📝 Display access URLs

## Access the Application

Once started, visit: **http://localhost:5111**

### Default Credentials

- **Admin:** `admin` / `admin123`
- **Viewer:** `viewer` / `viewer123`

⚠️ Change the admin password after first login!

## Prerequisites

- Docker must be installed and running
- Jenkins must be running at `localhost:8080`

### Start Jenkins (if needed)

```bash
# macOS with Homebrew
brew services start jenkins-lts

# Or check: http://localhost:8080
```

## What Gets Started?

The script starts these containers:

| Container | Purpose | Port |
|-----------|---------|------|
| **backend** | Node.js API + Neon PostgreSQL | 3000 (internal) |
| **frontend** | React Application | 80 (internal) |
| **nginx** | Reverse Proxy | 5111 (public) |

**Note:** Jenkins runs on your host machine, not in Docker.

## Common Commands

```bash
# View logs
docker-compose -f docker-compose.external-jenkins.yml logs -f

# Stop services
docker-compose -f docker-compose.external-jenkins.yml down

# Restart services
docker-compose -f docker-compose.external-jenkins.yml restart

# Check status
docker ps
```

## Troubleshooting

### Jenkins Not Running
```bash
# Start Jenkins
brew services start jenkins-lts

# Verify it's running
curl -I http://localhost:8080
```

### Port 5111 Already in Use
```bash
# Find what's using the port
lsof -i :5111

# Kill the process
kill -9 <PID>
```

### Container Build Fails
```bash
# Clean rebuild
docker system prune -a
./start_running.sh
```

## Features

- ✅ User authentication with bcrypt encryption
- ✅ Role-based access (Admin, User, Viewer)
- ✅ Jenkins pipeline monitoring & triggering
- ✅ Build parameters support
- ✅ Real-time build status
- ✅ Audit logging for all actions
- ✅ Persistent PostgreSQL database (Neon)

## Need More Details?

See the full documentation: [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)

---

**Quick Tip:** The script includes colorized output to help you track progress and spot any issues!
