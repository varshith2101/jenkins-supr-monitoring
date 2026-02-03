# Jenkins Monitor - Startup Guide

## Prerequisites

Before running the application, ensure you have:

1. **Docker** installed and running
2. **Jenkins** running at `localhost:8080`
3. **Git** (for cloning the repository)

## Quick Start

### 1. Start Jenkins (if not already running)

**macOS (Homebrew):**
```bash
brew services start jenkins-lts
```

**Other Systems:**
Visit [Jenkins Installation Guide](https://www.jenkins.io/doc/book/installing/)

Verify Jenkins is running by visiting: http://localhost:8080

### 2. Run the Startup Script

From the project root directory:

```bash
./start_running.sh
```

This script will:
- ✅ Check if Jenkins is accessible
- 🛑 Stop any existing containers
- 🔨 Rebuild all Docker containers
- 🚀 Start the application
- 📊 Display status and logs
- 📝 Show access information

### 3. Access the Application

Once started, access the application at:

**🌐 Main Application:** http://localhost:5111

**Default Login Credentials:**
- **Admin:** `admin` / `admin123`
- **Viewer:** `viewer` / `viewer123`

⚠️ **IMPORTANT:** Change the admin password immediately after first login!

## Architecture

The application runs three Docker containers:

1. **Backend** - Node.js API server connected to Neon PostgreSQL
2. **Frontend** - React application (built and served)
3. **Nginx** - Reverse proxy (port 5111)

**Note:** Jenkins runs externally on the host machine (not in Docker)

## Database

The application uses **Neon PostgreSQL** cloud database for:
- User management with bcrypt password hashing
- Audit logs for all user actions
- Persistent storage across container restarts

## Useful Commands

### View Live Logs
```bash
docker-compose -f docker-compose.external-jenkins.yml logs -f
```

### View Specific Container Logs
```bash
docker logs -f backend
docker logs -f frontend
docker logs -f nginx
```

### Restart All Services
```bash
docker-compose -f docker-compose.external-jenkins.yml restart
```

### Stop All Services
```bash
docker-compose -f docker-compose.external-jenkins.yml down
```

### Check Container Status
```bash
docker-compose -f docker-compose.external-jenkins.yml ps
```

### Rebuild a Specific Container
```bash
docker-compose -f docker-compose.external-jenkins.yml build backend
docker-compose -f docker-compose.external-jenkins.yml up -d backend
```

## Troubleshooting

### Jenkins Not Accessible
```bash
# Check if Jenkins is running
curl -I http://localhost:8080

# Start Jenkins (macOS)
brew services start jenkins-lts
```

### Container Won't Start
```bash
# Check container logs
docker logs backend

# Rebuild container
docker-compose -f docker-compose.external-jenkins.yml build --no-cache backend
docker-compose -f docker-compose.external-jenkins.yml up -d
```

### Database Connection Issues
The application uses Neon PostgreSQL cloud database. If connection fails:
1. Check internet connectivity
2. Verify DATABASE_URL in `docker-compose.external-jenkins.yml`
3. Check backend logs: `docker logs backend`

### Port Already in Use
```bash
# Find process using port 5111
lsof -i :5111

# Kill the process if needed
kill -9 <PID>
```

## User Roles

The application has three user roles:

1. **Admin**
   - Full access to all features
   - Can manage users
   - Can trigger builds
   - Can view all pipelines

2. **User**
   - Can trigger builds
   - Can view assigned pipelines
   - Cannot manage users

3. **Viewer**
   - Read-only access
   - Can view pipeline status
   - Cannot trigger builds
   - Cannot manage users

## Security Notes

1. **Change Default Passwords:** The default admin password should be changed immediately
2. **JWT Secret:** Update JWT_SECRET in docker-compose files for production
3. **Database Credentials:** Store DATABASE_URL securely (use .env files in production)
4. **Jenkins Token:** Update Jenkins credentials in docker-compose files

## Development Mode

For local development without Docker:

### Backend (Terminal 1)
```bash
cd backend
npm install
npm start
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

Access at: http://localhost:5173

## Project Structure

```
DevOps/
├── backend/                    # Node.js Express API
│   ├── src/
│   │   ├── config/            # Database & app config
│   │   ├── models/            # UserDB & AuditLog models
│   │   ├── routes/            # API routes
│   │   └── middleware/        # Auth middleware
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   └── services/          # API services
│   ├── Dockerfile
│   └── package.json
├── nginx/                      # Nginx reverse proxy
│   └── nginx.conf
├── docker-compose.yml          # Full stack with Jenkins
├── docker-compose.external-jenkins.yml  # External Jenkins
└── start_running.sh           # Startup script
```

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.external-jenkins.yml logs`
2. Review this guide
3. Check container health: `docker ps`

## Features

- ✅ User authentication with bcrypt
- ✅ Role-based access control (Admin, User, Viewer)
- ✅ Jenkins pipeline monitoring
- ✅ Build triggering with parameters
- ✅ Audit logging for all actions
- ✅ Real-time build status updates
- ✅ PostgreSQL database persistence
- ✅ Docker containerization
- ✅ Nginx reverse proxy
