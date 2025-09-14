# Deployment Guide

## Overview

This project consists of a React client (Vite) and an Express/Firebase backend server that are deployed to EC2 using GitHub Actions.

**Note**: We will want to use `npm` as opposed to `pnpm` to get CI to work.


### ✅ Fix: Restrict permissions on your PEM

Run this on your Mac:

```bash
chmod 600 ~/Desktop/mykey.pem
```

This makes the file **readable/writable only by you**.

---

### 🔑 Then retry SSH

```bash
ssh -i ~/Desktop/mykey.pem ubuntu@3.144.215.93
```

And for `scp`:

**Important**: Make sure your .pem file has the correct permissions (see step above):
```bash
chmod 600 ~/Desktop/mykey.pem
```

First, create the directory on the EC2 instance:
```bash
ssh -i ~/Desktop/mykey.pem ubuntu@3.144.215.93
sudo mkdir -p /var/www/lec9-server
sudo chown ubuntu:ubuntu /var/www/lec9-server
exit
```

Then transfer the serviceAccount.json file (use full local path):
```bash
scp -i ~/Desktop/mykey.pem ~/Desktop/trends-mono-sp25/demos/lec9/server/serviceAccount.json ubuntu@3.144.215.93:/var/www/lec9-server/
```

## Architecture

-   **Client**: React app built with Vite, served via Nginx
-   **Server**: Express + Firebase Admin SDK, managed with PM2
-   **CI/CD**: GitHub Actions workflow triggered on push to `test-ci` branch
-   **Infrastructure**: AWS EC2 instance (Ubuntu)

## Required GitHub Secrets (EC2 Only)

You only need to configure these EC2 connection secrets in your GitHub repository:

-   **`EC2_SSH_KEY`**: Private SSH key for EC2 instance access (entire .pem file content)
-   **`EC2_HOST`**: EC2 instance public IP or domain (e.g., `3.144.215.93` or use Elastic IP)
-   **`EC2_USER`**: `ubuntu` (for Ubuntu instances)

## Local Files Required

The workflow uses your local environment files directly. Make sure these exist before deploying:

### Client `.env` file (`demos/lec9/client/.env`)

```env
VITE_API_URL=http://YOUR_EC2_IP:5000
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Server Files (`demos/lec9/server/`)

-   **`.env`**: Server environment variables
    ```env
    PORT=5000
    NODE_ENV=production
    CLIENT_URL=http://YOUR_EC2_IP
    ```
-   **`serviceAccount.json`**: Firebase Admin SDK credentials (download from Firebase Console)

## How It Works

1. **Local Files**: The workflow copies your local `.env` and `serviceAccount.json` files
2. **Build**: Builds both client and server locally
3. **Deploy**: Transfers everything to EC2 (including environment files)
4. **No Secrets Management**: No need to manage Firebase secrets in GitHub - just use your local files

**Note**: This project is in a monorepo at `demos/lec9/` - the workflow handles this path structure automatically.

## EC2 Setup

### Prerequisites

Run the setup script on your EC2 instance:

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Download and run setup script
wget https://raw.githubusercontent.com/yourusername/yourrepo/test-ci/demos/lec9/scripts/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

This installs:

-   Node.js 18+
-   PM2 (process manager)
-   Nginx (web server)
-   TypeScript

### Security Group Configuration

Ensure your EC2 security group has these inbound rules:

-   Port 22 (SSH)
-   Port 80 (HTTP)
-   Port 443 (HTTPS - if using SSL)
-   Port 5000 (Backend API)

### Using Elastic IP (Recommended)

To avoid IP changes when instance restarts:

1. Go to EC2 → Elastic IPs
2. Allocate new address
3. Associate with your instance
4. Use this IP for `EC2_HOST`

## Deployment Process

### Automatic Deployment

Push to the `test-ci` branch to trigger deployment:

```bash
git checkout -b test-ci
git add .
git commit -m "Deploy to EC2"
git push origin test-ci
```

### What Happens During Deployment

1. **Build Phase** (GitHub Actions):

    - Uses your local `.env` files
    - Builds React client
    - Compiles TypeScript server

2. **Transfer Phase**:

    - Client dist → `/var/www/lec9-client`
    - Server (with .env and serviceAccount.json) → `/var/www/lec9-server`

3. **Server Setup** (on EC2):
    - Installs production dependencies
    - PM2 manages the server
    - Nginx serves the client

## PM2 Management

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# View server status
pm2 list

# View logs
pm2 logs lec9-server

# Restart server
pm2 restart lec9-server

# Monitor
pm2 monit
```

## Nginx Configuration

The workflow automatically configures Nginx to:

-   Serve React app from port 80
-   Proxy `/api/*` to backend on port 5000

## Troubleshooting

### Server Not Starting

```bash
pm2 logs lec9-server --lines 50
ls -la /var/www/lec9-server/
cat /var/www/lec9-server/.env
```

### Client Not Loading

```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
ls -la /var/www/lec9-client/
```

### Port Already in Use

```bash
sudo lsof -i :5000
pm2 stop all  # Stop all PM2 processes
```

## Directory Structure on EC2

```
/var/www/
├── lec9-client/        # React app
│   ├── index.html
│   └── assets/
└── lec9-server/        # Node.js server
    ├── server.js
    ├── .env           # Copied from your local
    ├── serviceAccount.json  # Copied from your local
    └── node_modules/
```

## Quick Setup Checklist

1. ✅ Create EC2 instance (Ubuntu)
2. ✅ Configure security group (ports 22, 80, 443, 5000)
3. ✅ Run setup script on EC2
4. ✅ Create local `.env` files
5. ✅ Add `serviceAccount.json` to server folder
6. ✅ Configure GitHub Secrets (EC2_SSH_KEY, EC2_HOST, EC2_USER)
7. ✅ Push to `test-ci` branch

## Rollback

If deployment fails:

```bash
# Quick restart
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
pm2 restart lec9-server

# Or revert and redeploy
git revert HEAD
git push origin test-ci
```
