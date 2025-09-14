#!/bin/bash

# EC2 Setup Script for lec9 Application
# Run this script on a fresh Ubuntu EC2 instance to prepare it for deployments

set -e

echo "🚀 Starting EC2 setup for lec9 application..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node installation
node_version=$(node --version)
npm_version=$(npm --version)
echo "✅ Node.js installed: $node_version"
echo "✅ npm installed: $npm_version"

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install TypeScript globally
echo "📦 Installing TypeScript..."
sudo npm install -g typescript

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install Git (if not already installed)
echo "📦 Installing Git..."
sudo apt-get install -y git

# Create deployment directories
echo "📁 Creating deployment directories..."
sudo mkdir -p /var/www/lec9-client
sudo mkdir -p /var/www/lec9-server

# Set proper ownership
current_user=$(whoami)
sudo chown -R $current_user:$current_user /var/www/

# Setup PM2 to start on boot
echo "⚙️ Configuring PM2 startup..."
pm2 startup systemd -u $current_user --hp /home/$current_user
pm2 save

# Configure firewall (if ufw is installed)
if command -v ufw &> /dev/null; then
    echo "🔒 Configuring firewall..."
    sudo ufw allow 22/tcp    # SSH
    sudo ufw allow 80/tcp    # HTTP
    sudo ufw allow 443/tcp   # HTTPS
    sudo ufw allow 5000/tcp  # Backend server
    echo "✅ Firewall configured"
else
    echo "⚠️ UFW not found, skipping firewall configuration"
fi

# Create sample nginx configuration
echo "⚙️ Creating Nginx configuration template..."
sudo tee /etc/nginx/sites-available/lec9-client.template << 'EOF'
# This is a template configuration. The actual config will be created during deployment.
# The GitHub Actions workflow will automatically configure Nginx.

server {
    listen 80;
    listen [::]:80;
    server_name _;  # Replace with your domain

    root /var/www/lec9-client;
    index index.html;

    # React app routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Install certbot for SSL (optional)
read -p "Do you want to install Certbot for SSL certificates? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing Certbot..."
    sudo apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot installed. Run 'sudo certbot --nginx' after configuring your domain."
fi

# System information
echo ""
echo "========================================="
echo "✅ EC2 Setup Complete!"
echo "========================================="
echo ""
echo "📊 System Information:"
echo "- Node.js: $node_version"
echo "- npm: $npm_version"
echo "- PM2: $(pm2 --version)"
echo "- TypeScript: $(tsc --version)"
echo "- Nginx: $(nginx -v 2>&1)"
echo ""
echo "📁 Directories created:"
echo "- /var/www/lec9-client (React client)"
echo "- /var/www/lec9-server (Backend server)"
echo ""
echo "🔧 What happens during deployment:"
echo "1. GitHub Actions builds your code"
echo "2. Creates .env files from GitHub Secrets"
echo "3. Deploys everything to this EC2 instance"
echo "4. PM2 manages the backend server"
echo "5. Nginx serves the React client"
echo ""
echo "📝 Next steps:"
echo "1. Configure GitHub Secrets in your repository:"
echo "   - EC2_SSH_KEY (your private SSH key)"
echo "   - EC2_HOST (this instance's IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'unknown'))"
echo "   - EC2_USER (current user: $current_user)"
echo "   - FIREBASE_SERVICE_ACCOUNT (Firebase Admin SDK JSON)"
echo "   - Firebase web config (API_KEY, AUTH_DOMAIN, etc.)"
echo "   - APPLICATION URLs (CLIENT_URL, API_URL)"
echo ""
echo "2. Push to main branch to trigger deployment"
echo ""
echo "3. (Optional) Set up a domain and SSL:"
echo "   sudo certbot --nginx -d yourdomain.com"
echo ""
echo "🔒 Security reminders:"
echo "- Configure EC2 security groups appropriately"
echo "- All sensitive data is managed through GitHub Secrets"
echo "- No manual file management needed on this server"
echo ""
echo "🚀 Happy deploying!"