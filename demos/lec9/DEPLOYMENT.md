# Deployment Guide for Lec9 Demo

## 🚀 Quick Start

### Prerequisites
1. **EC2 Instance** (Ubuntu 22.04 or later)
2. **GitHub Repository** with secrets configured
3. **Firebase Project** with serviceAccount.json

### Step 1: Configure AWS Security Group
Add these inbound rules to your EC2 security group:
- **SSH (22)**: Your IP
- **HTTP (80)**: 0.0.0.0/0
- **Custom TCP (5000)**: 0.0.0.0/0
- **HTTPS (443)**: 0.0.0.0/0 (optional)

### Step 2: Initial EC2 Setup
```bash
# SSH into your EC2
ssh -i ~/Desktop/mykey.pem ubuntu@YOUR_EC2_IP

# Run setup script (installs Node.js, PM2, Nginx, TypeScript)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2 typescript

# Create directories
sudo mkdir -p /var/www/lec9-client /var/www/lec9-server
sudo chown -R ubuntu:ubuntu /var/www/
```

### Step 3: Upload Service Account (One-time setup)
```bash
# From your local machine:
ssh ubuntu@YOUR_EC2_IP "mkdir -p ~/secrets"
scp -i ~/Desktop/mykey.pem ~/Desktop/trends-mono-sp25/demos/lec9/server/serviceAccount.json ubuntu@YOUR_EC2_IP:~/secrets/
```

### Step 4: Configure GitHub Secrets
In your GitHub repository settings, add:
- `EC2_SSH_KEY`: Contents of your .pem file
- `EC2_HOST`: Your EC2 IP (e.g., 3.144.215.93)
- `EC2_USER`: ubuntu

### Step 5: Create Environment Files
**Client** (`demos/lec9/client/.env.example`):
```env
VITE_SUPER_SECRET_KEY="your_secret_key_here"
```

**Server** (`demos/lec9/server/.env.example`):
```env
PORT=8080
```

### Step 6: Deploy
```bash
git add .
git commit -m "Deploy"
git push origin test-ci
```

## 📋 Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser   │────▶│  Nginx (:80) │────▶│ React Client │
└─────────────┘     └──────────────┘     └──────────────┘
                            │
                            │ /api/*
                            ▼
                    ┌──────────────┐     ┌──────────────┐
                    │ PM2 Manager  │────▶│Express(:5000)│
                    └──────────────┘     └──────────────┘
```

## 🔧 How the CI/CD Works

1. **GitHub Actions** triggers on push to `test-ci`
2. **Build Phase**:
   - Client: Uses `.env.example` → builds React app
   - Server: Verifies dependencies only (no build)
3. **Deploy Phase**:
   - Creates directories on EC2
   - Transfers client dist → `/var/www/lec9-client`
   - Transfers server source → `/var/www/lec9-server`
4. **EC2 Setup Phase**:
   - Installs all dependencies (including dev)
   - Copies `serviceAccount.json` from `~/secrets/`
   - Compiles TypeScript on EC2
   - Removes dev dependencies
   - Starts/restarts PM2 process
   - Configures Nginx

## 🐛 Troubleshooting

### Site shows "Welcome to nginx"
```bash
# Remove default site and reload
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

### Connection Refused / Site Can't Be Reached
1. Check AWS Security Group rules (ports 80, 5000)
2. Check services:
```bash
sudo systemctl status nginx
pm2 list
sudo netstat -tlnp | grep -E ':80|:5000'
```

### Server Not Running
```bash
pm2 logs lec9-server --lines 50
cd /var/www/lec9-server
ls -la  # Check if serviceAccount.json exists
```

### API Returns 404
```bash
# Check PM2 status
pm2 list
pm2 logs lec9-server

# Test API directly
curl http://localhost:5000/health
```

### TypeScript Compilation Fails
```bash
cd /var/www/lec9-server
npm ci  # Install all dependencies
npx tsc  # Try compiling manually
```

## 📁 Directory Structure

**EC2 Server:**
```
/var/www/
├── lec9-client/          # React build output
│   ├── index.html
│   └── assets/
└── lec9-server/          # Node.js server
    ├── server.ts         # Source
    ├── server.js         # Compiled
    ├── serviceAccount.json
    └── node_modules/

~/secrets/
└── serviceAccount.json   # Persistent location
```

**Local Project:**
```
demos/lec9/
├── client/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
└── server/
    ├── server.ts
    ├── package.json
    ├── package-lock.json
    └── .env.example
```

## 🔄 Common Commands

### PM2 Management
```bash
pm2 list                    # View all processes
pm2 logs lec9-server        # View logs
pm2 restart lec9-server     # Restart server
pm2 stop lec9-server        # Stop server
pm2 monit                   # Monitor resources
```

### Nginx Management
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t               # Test configuration
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Manual Deployment Fix
```bash
# If automatic deployment fails
ssh ubuntu@YOUR_EC2_IP
cd /var/www/lec9-server
npm ci
cp ~/secrets/serviceAccount.json .
npx tsc
pm2 restart lec9-server
```

## ⚠️ Important Notes

1. **serviceAccount.json** is stored in `~/secrets/` to persist across deployments
2. **TypeScript compilation** happens on EC2 (not in GitHub Actions)
3. **.env.example** files are used for builds (not .env)
4. **Default Nginx site** is automatically removed during deployment
5. **Node.js version**: Requires v18+ (some Firebase packages need v20+)

## 🆘 Quick Fixes

### Reset Everything
```bash
# On EC2
pm2 delete all
sudo rm -rf /var/www/lec9-*
sudo rm /etc/nginx/sites-enabled/lec9-client
sudo systemctl restart nginx

# Then redeploy from GitHub
```

### Check Everything is Running
```bash
curl http://localhost:80          # Should show React app
curl http://localhost:5000/health # Should show API response
pm2 list                          # Should show lec9-server online
sudo systemctl status nginx        # Should be active
```

## 📝 Checklist for New Deployment

- [ ] EC2 instance created
- [ ] Security group configured (ports 22, 80, 5000)
- [ ] serviceAccount.json uploaded to `~/secrets/`
- [ ] GitHub secrets configured (EC2_SSH_KEY, EC2_HOST, EC2_USER)
- [ ] .env.example files created
- [ ] package-lock.json files exist (not pnpm-lock.yaml)
- [ ] Push to `test-ci` branch

## 🔗 Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)