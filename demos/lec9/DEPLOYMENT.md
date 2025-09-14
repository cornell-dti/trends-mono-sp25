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
- **HTTPS (443)**: 0.0.0.0/0 (optional)

Note: Port 8080 is NOT needed externally - Nginx proxies from port 80 to localhost:8080

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

# Add swap space (prevents memory issues on t2.micro)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify swap is active
free -h
```

### Step 3: Configure GitHub Secrets
In your GitHub repository → Settings → Secrets → Actions → New repository secret

**Required Secrets:**
- `EC2_SSH_KEY`: Contents of your .pem file
- `EC2_HOST`: Your EC2 IP (e.g., 3.144.215.93)
- `EC2_USER`: ubuntu
- `VITE_SUPER_SECRET_KEY`: Your client secret key (e.g., "my-secret-123")

**Optional Secrets (have defaults):**
- `VITE_API_URL`: Leave empty - defaults to window.location.origin (same domain)
- `SERVER_PORT`: Leave empty - defaults to 8080
- `NODE_ENV`: Leave empty - defaults to production

### Step 4: Upload Service Account (One-time setup)
```bash
# From your local machine:
ssh ubuntu@YOUR_EC2_IP "mkdir -p ~/secrets"
scp -i ~/Desktop/mykey.pem ~/Desktop/trends-mono-sp25/demos/lec9/server/serviceAccount.json ubuntu@YOUR_EC2_IP:~/secrets/
```

### Step 5: Deploy
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
                    │ PM2 Manager  │────▶│Express(:8080)│
                    └──────────────┘     └──────────────┘
```

## 🔧 How the CI/CD Works

1. **GitHub Actions** triggers on push to `test-ci`
2. **Build Phase**:
   - Client: Creates .env.production from GitHub Secrets → builds React app
   - Server: Verifies dependencies only (no build)
3. **Deploy Phase**:
   - Transfers client dist → `/var/www/lec9-client`
   - Transfers server source → `/var/www/lec9-server`
4. **EC2 Setup Phase**:
   - Installs all dependencies
   - Copies `serviceAccount.json` from `~/secrets/`
   - Compiles TypeScript on EC2
   - Starts/restarts PM2 with env vars from GitHub Secrets
   - Configures Nginx

## 🐛 Troubleshooting

### Site shows "Welcome to nginx" or 500 Error
```bash
# Fix Nginx config
sudo tee /etc/nginx/sites-available/lec9-client << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /var/www/lec9-client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Remove default site and reload
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/lec9-client /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Connection Refused / Site Can't Be Reached
1. Check AWS Security Group rules (ports 80, 22)
2. Check services:
```bash
sudo systemctl status nginx
pm2 list
sudo netstat -tlnp | grep -E ':80|:8080'
```

### Server Not Running
```bash
pm2 logs lec9-server --lines 50
cd /var/www/lec9-server
ls -la  # Check if serviceAccount.json exists
```

### API Returns 404 or Bad Gateway
```bash
# Check PM2 status
pm2 list
pm2 logs lec9-server

# Test API directly
curl http://localhost:8080/api/
```

### Client JavaScript Error (API_KEY not defined)
This means `VITE_SUPER_SECRET_KEY` is not set in GitHub Secrets. Add it as described in Step 3.

### TypeScript Compilation Fails
```bash
cd /var/www/lec9-server
npm ci  # Install all dependencies
npx tsc  # Try compiling manually
```

### Deployment Hangs / SSH Connection Refused
**This is common on t2.micro instances with limited RAM (1GB)**

**Quick Fix - Reboot EC2:**
```bash
# From AWS Console:
# EC2 → Instances → Select your instance → Instance State → Reboot

# Or using AWS CLI:
aws ec2 reboot-instances --instance-ids YOUR_INSTANCE_ID
```

**Prevention - Add swap space (see Step 2)**

**Clean up before deployment:**
```bash
# SSH into EC2 and clean up
pkill -f npm
pkill -f node
pkill -f tsc
pm2 kill
rm -rf /var/www/lec9-server/node_modules
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
│   └── .env.example      # Not used - values come from GitHub Secrets
└── server/
    ├── server.ts
    ├── package.json
    ├── package-lock.json
    └── .env.example      # Not used - values come from GitHub Secrets
```

## 🔄 Common Commands

### PM2 Management
```bash
pm2 list                    # View all processes
pm2 logs lec9-server        # View logs
pm2 restart lec9-server     # Restart server
pm2 stop lec9-server        # Stop server
pm2 monit                   # Monitor resources
pm2 env 0                   # View environment variables for process 0
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
PORT=8080 pm2 restart lec9-server
```

### View Current Environment Variables
```bash
# Check what environment variables the server is using
pm2 env lec9-server
```

## ⚠️ Important Notes

1. **Environment Variables** are managed through GitHub Secrets (no .env files needed)
2. **serviceAccount.json** is stored in `~/secrets/` to persist across deployments
3. **TypeScript compilation** happens on EC2 (not in GitHub Actions)
4. **Default Nginx site** is automatically removed during deployment
5. **API URL** defaults to `window.location.origin` (same domain as client)
6. **Port 8080** is used for the server (not 5000)

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
curl http://localhost:8080/api/   # Should show "hello world!"
pm2 list                          # Should show lec9-server online
sudo systemctl status nginx       # Should be active
```

### Verify GitHub Secrets are Set
```bash
# After deployment, check if client has the secret key
# Open browser console at http://YOUR_EC2_IP and check for errors
# If you see "API_KEY is not defined", the VITE_SUPER_SECRET_KEY secret is missing
```

## 📝 Checklist for New Deployment

- [ ] EC2 instance created
- [ ] Security group configured (ports 22, 80 only)
- [ ] Node.js, PM2, Nginx installed on EC2
- [ ] Swap space added (for t2.micro)
- [ ] serviceAccount.json uploaded to `~/secrets/`
- [ ] GitHub Secrets configured:
  - [ ] EC2_SSH_KEY
  - [ ] EC2_HOST
  - [ ] EC2_USER
  - [ ] VITE_SUPER_SECRET_KEY (important!)
- [ ] package-lock.json files exist (not pnpm-lock.yaml)
- [ ] Push to `test-ci` branch

## 🔗 Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)