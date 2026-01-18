#!/bin/bash

# ============================================
# SpaceIdentity - Vultr Deployment Script
# Run this on your Vultr Cloud Compute instance
# ============================================

set -e  # Exit on any error

echo "🚀 SpaceIdentity - Vultr Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Configuration - UPDATE THESE!
DOMAIN="${DOMAIN:-your-domain.com}"
GEMINI_API_KEY="${GEMINI_API_KEY:-your-gemini-api-key}"
APP_DIR="/var/www/spaceidentity"
REPO_URL="https://github.com/AryanMistry/uofthacks13.git"

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    echo -e "${GREEN}Docker installed successfully!${NC}"
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

echo -e "${YELLOW}Step 3: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully!${NC}"
else
    echo -e "${GREEN}Docker Compose already installed${NC}"
fi

echo -e "${YELLOW}Step 4: Installing Nginx...${NC}"
apt install -y nginx certbot python3-certbot-nginx

echo -e "${YELLOW}Step 5: Cloning/Updating repository...${NC}"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull origin main
else
    mkdir -p "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo -e "${YELLOW}Step 6: Creating environment file...${NC}"
cat > "$APP_DIR/.env" << EOF
GEMINI_API_KEY=${GEMINI_API_KEY}
VULTR_DEPLOYMENT=true
NODE_ENV=production
EOF

echo -e "${YELLOW}Step 7: Building Docker image...${NC}"
cd "$APP_DIR"
docker-compose build --no-cache

echo -e "${YELLOW}Step 8: Starting application...${NC}"
docker-compose up -d

echo -e "${YELLOW}Step 9: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/spaceidentity << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
        
        # For large image uploads
        client_max_body_size 50M;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/spaceidentity /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t && systemctl reload nginx

echo -e "${YELLOW}Step 10: Setting up firewall...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "Your app is running at: ${YELLOW}http://${DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Point your domain DNS to this server's IP"
echo "2. Run: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo "   to enable HTTPS (SSL)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:     docker-compose logs -f"
echo "  Restart app:   docker-compose restart"
echo "  Stop app:      docker-compose down"
echo "  Rebuild:       docker-compose up -d --build"
echo ""
