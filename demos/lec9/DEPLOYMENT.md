# Deployment Guide

## Overview

This project consists of a React client (Vite) and an Express/Firebase backend server that are deployed to EC2 using GitHub Actions.

**Note**: We will want to use `npm` as opposed to `pnpm` to get CI to work.

⚠️ **Important Changes**:
- The CI workflow now uses `.env.example` files (not `.env` files) for builds
- `serviceAccount.json` must be uploaded to a persistent location on EC2 before deployment
- TypeScript compilation happens on EC2 (not in GitHub Actions) to avoid missing `serviceAccount.json` errors


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

Create a persistent secrets directory and upload serviceAccount.json:
```bash
# Create secrets directory on EC2
ssh -i ~/Desktop/mykey.pem ubuntu@3.144.215.93 "mkdir -p ~/secrets"

# Upload serviceAccount.json to persistent location (won't be overwritten during deployment)
scp -i ~/Desktop/mykey.pem ~/Desktop/trends-mono-sp25/demos/lec9/server/serviceAccount.json ubuntu@3.144.215.93:~/secrets/
```

**Note**: The CI workflow will automatically copy `serviceAccount.json` from `~/secrets/` to the deployment directory.

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

### Client `.env.example` file (`demos/lec9/client/.env.example`)

**Note**: The CI uses `.env.example` for builds. You can manually create a `.env` file locally for development.

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

-   **`.env.example`**: Server environment variables template
    ```env
    PORT=8080
    ```
-   **`serviceAccount.json`**: Firebase Admin SDK credentials (download from Firebase Console)
    - **Important**: Don't commit this file to git!
    - Upload it to EC2 manually using the commands above

## How It Works

1. **Environment Files**: The workflow uses `.env.example` files for builds
2. **Client Build**: Builds React client locally using `.env.example` → `.env.production`
3. **Server Deploy**: Transfers TypeScript source to EC2 (compilation happens on EC2)
4. **Secret Management**: `serviceAccount.json` is stored in `~/secrets/` on EC2 and copied during deployment
5. **TypeScript Compilation**: Happens on EC2 after deployment (where `serviceAccount.json` exists)

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

    - Uses `.env.example` files
    - Builds React client
    - Verifies server dependencies (no TypeScript compilation)

2. **Transfer Phase**:

    - Client dist → `/var/www/lec9-client`
    - Server source code → `/var/www/lec9-server`

3. **Server Setup** (on EC2):
    - Installs production dependencies
    - Copies `serviceAccount.json` from `~/secrets/`
    - Compiles TypeScript to JavaScript
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
4. ✅ Create `.env.example` files in both client and server
5. ✅ Upload `serviceAccount.json` to EC2's `~/secrets/` directory (see commands above)
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
