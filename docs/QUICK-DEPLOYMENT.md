# AgentifUI Quick Deployment Guide

A streamlined guide for deploying AgentifUI on your own server with all required dependencies.

## 📋 Overview

This guide will help you deploy AgentifUI on a VPS or dedicated server.

**What we'll install:**

- Node.js (via NVM)
- pnpm package manager
- PM2 process manager
- Supabase CLI
- Docker & Docker Compose
- Dify (self-hosted AI platform)
- AgentifUI application

## 🚀 Step 1: System Prerequisites

Update your system packages:

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get upgrade -y

# CentOS/RHEL
sudo yum update -y
```

## 🔧 Step 2: Install Node.js via NVM

Install NVM (Node Version Manager) for flexible Node.js management:

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc for zsh users

# Install and use Node.js LTS
nvm install --lts
nvm use --lts

# Verify installation
node --version  # Should show v22.x.x or later
```

## 📦 Step 3: Install pnpm Package Manager

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should show 10.x.x or later
```

## ⚡ Step 4: Install PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version

```

## 🗄️ Step 5: Install Supabase CLI

Choose your installation method:

**For macOS:**

```bash
brew install supabase/tap/supabase
```

**For Linux:**

```bash
curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/

# Verify installation
supabase --version
```

## 🐳 Step 6: Install Docker & Docker Compose

**Method 1: Official Docker Installation (Recommended)**

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
sudo apt-get install ca-certificates curl gnupg lsb-release -y

# Create directory for apt keyrings
sudo install -m 0755 -d /etc/apt/keyrings

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository to apt sources
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
  $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index and install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Add current user to docker group
sudo usermod -aG docker $USER

# Logout and login again, or run:
newgrp docker

# Verify Docker installation
sudo docker run hello-world
docker --version
docker compose version
```

**Method 2: Quick Installation Script (Alternative)**

```bash
# Quick install with convenience script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

## 🤖 Step 7: Install & Configure Dify (Self-hosted AI Platform)

```bash
# Clone Dify repository
git clone https://github.com/langgenius/dify.git
cd dify/docker

# Copy environment template
cp .env.example .env

# Edit the configuration to change the port (optional)
nano .env
```

**Important Port Configuration:**
If you want to run Dify on a different port (recommended to avoid conflicts), edit the `.env` file:

```env
# Change the default port from 80 to 3002
EXPOSE_NGINX_PORT=3002
```

**Start Dify services:**

```bash
# Start Dify with Docker Compose
docker compose up -d

# Check if services are running
docker compose ps

# View logs if needed
docker compose logs -f
```

**Access Dify Setup:**

1. Open your browser and go to `http://your-server-ip:3002`
2. Complete the initial setup wizard
3. Create your first application
4. Note down the API endpoint and key for later configuration

## 📥 Step 8: Download & Setup AgentifUI

```bash
# Navigate to your desired directory (e.g., /opt or /home/user)
cd /opt  # or your preferred location

# Clone AgentifUI repository
git clone https://github.com/ifLabX/AgentifUI.git
cd AgentifUI

# Install dependencies
pnpm install
```

## 🗃️ Step 9: Setup Supabase Database

**Option A: Use Local Supabase (Recommended for self-hosted)**

```bash
# Navigate to AgentifUI directory (if not already there)
cd AgentifUI

# Start local Supabase instance (project already includes Supabase config)
supabase start

# IMPORTANT: Note down the output values - you'll need them for the next step:
# - API URL (usually http://localhost:54321)
# - anon key
# - service_role key

# Apply database migrations
supabase db push --local
```

**Option B: Use Supabase Cloud**

1. Visit [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to Settings → API
4. Copy the Project URL and API keys
5. Run: `supabase link --project-ref your-project-id`
6. Run: `supabase db push`

## ⚙️ Step 10: Configure Environment Variables

Create the production environment file:

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Essential environment variables:**

```env
# ===========================================
# Supabase Configuration (Required)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# For cloud Supabase, use: https://your-project-ref.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key-from-supabase-start
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key-from-supabase-start

# Required only for self-hosted Supabase installations
# SUPABASE_JWT_SECRET=your-jwt-secret

# ===========================================
# API Encryption Key (Required)
# ===========================================
API_ENCRYPTION_KEY=your-32-byte-hex-string

# ===========================================
# Application Settings (Required)
# ===========================================
NEXT_PUBLIC_APP_URL=http://your-server-ip:3000

# ===========================================
# Authentication & SSO (Optional)
# ===========================================
NEXT_PUBLIC_SSO_ONLY_MODE=false

# ===========================================
# CORS Settings (Important for production)
# ===========================================
CORS_ALLOWED_ORIGINS=http://your-server-ip:3000,http://your-domain.com

# Optional for development only
# DEV_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Generate API Encryption Key:**

```bash
# Generate a secure 32-byte hex key
openssl rand -hex 32
```

**Important:** Use the actual values from the `supabase start` output in the previous step for the Supabase keys.

## 🚀 Step 11: Build & Deploy with PM2

```bash
# Deploy with PM2 (this will automatically build the application)
pnpm run deploy

# Check deployment status
pm2 list
pm2 logs

# Save PM2 configuration for auto-restart
pm2 save
```

**Note:** The `pnpm run deploy` command automatically builds the application using `build:standalone` mode and then starts it with PM2. If you prefer the legacy deployment method, you can use `pnpm run deploy:legacy` instead.

## ✅ Step 12: Verification & Access

**Verify all services are running:**

```bash
# Check PM2 processes
pm2 status

# Check Docker containers
docker ps

# Check Supabase status
supabase status

# Test application response
curl -I http://localhost:3000
```

**Access your application:**

- AgentifUI: `http://your-server-ip:3000`
- Dify: `http://your-server-ip:3002`
- Supabase Studio: `http://localhost:54323` (if using local)

## 👤 Step 13: Create Admin User

1. **Register a user account:**
   - Visit your AgentifUI URL
   - Click "Register" and create an account

2. **Promote to admin via Supabase:**

   ```bash
   # Access Supabase SQL Editor (local: http://localhost:54323)
   # Run this SQL query:
   ```

   ```sql
   SELECT public.initialize_admin('your-email@example.com');
   ```

3. **Verify admin access:**
   - Log out and log back in
   - Visit `/admin` route
   - You should see the admin dashboard

## 🔧 Management Commands

**PM2 Management:**

```bash
# View status
pm2 status

# View logs
pm2 logs

# Restart application
pm2 restart all

# Stop application
pm2 stop all

# Monitor resources
pm2 monit
```

**Dify Management:**

```bash
cd /path/to/dify/docker

# Stop Dify
docker compose down

# Start Dify
docker compose up -d

# View logs
docker compose logs -f
```

**Supabase Management:**

```bash
# Stop local Supabase
supabase stop

# Start local Supabase
supabase start

# Reset database (caution!)
supabase db reset --local
```

## 🚨 Troubleshooting

**Port conflicts:**

```bash
# Check what's using a port
sudo lsof -i :3000
sudo lsof -i :3002

# Kill process if needed
sudo kill -9 <PID>
```

**Service not starting:**

```bash
# Check logs
pm2 logs
docker compose logs
journalctl -u docker

# Restart services
pm2 restart all
docker compose restart
sudo systemctl restart docker
```

**Database connection issues:**

```bash
# Check Supabase status
supabase status

# Reset and restart
supabase db reset --local
supabase db push --local
```

## 🔒 Security Recommendations

1. **Firewall Configuration:**

   ```bash
   # Install UFW (Ubuntu)
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 3000  # AgentifUI
   sudo ufw allow 3002  # Dify (if exposing publicly)
   ```

2. **SSL/HTTPS Setup:**
   - Use a reverse proxy (nginx/apache) with Let's Encrypt
   - Configure proper domain names
   - Redirect HTTP to HTTPS

3. **Regular Updates:**

   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade

   # Update Node.js
   nvm install --lts
   nvm use --lts

   # Update application
   cd /opt/AgentifUI
   git pull
   pnpm install
   pnpm run build
   pm2 restart all
   ```

## 📊 Monitoring

**System Resources:**

```bash
# Monitor CPU/Memory
htop

# Check disk space
df -h

# Monitor network
iftop
```

**Application Health:**

```bash
# PM2 monitoring
pm2 monit
```

## 🎉 Completion

Your AgentifUI deployment is now complete! The application should be accessible at your server's IP address on port 3000.

**Next Steps:**

1. Configure a domain name and SSL certificate for production use
2. Set up regular backups for your database
3. Configure monitoring and alerting
4. Create additional admin users as needed

**Support:**

- Documentation: [GitHub Repository](https://github.com/ifLabX/AgentifUI)
- Issues: [GitHub Issues](https://github.com/ifLabX/AgentifUI/issues)
- Community: Join project discussions

---

🚀 **Your AgentifUI server is ready to use!**
