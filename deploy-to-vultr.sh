#!/bin/bash

# ============================================
# SpaceIdentity - Deploy to Vultr
# Run this script locally to deploy to your Vultr server
# ============================================

# Vultr Server Configuration
VULTR_IP="155.138.214.166"
VULTR_USER="root"

# Environment Variables for the app
GEMINI_API_KEY="AIzaSyAfLbhmlxaR1CFWZ70M7DSIkhtodM42mss"
VULTR_OBJECT_STORAGE_HOSTNAME="ewr1.vultrobjects.com"
VULTR_OBJECT_STORAGE_ACCESS_KEY="W2HQRP0TPOV9GAO1TV3L"
VULTR_OBJECT_STORAGE_SECRET_KEY="CoEjP6fjPAhx5PcAmZlAZAVlLl1lkNWgVv4ZL23L"

echo "🚀 Deploying SpaceIdentity to Vultr..."
echo "Server: $VULTR_IP"
echo ""
echo "You will be prompted for the server password."
echo "Password: ?9Rt=ikho8M#}*=%"
echo ""

# Create the remote setup script
cat << 'REMOTE_SCRIPT' > /tmp/vultr-setup.sh
#!/bin/bash
set -e

echo "📦 Step 1: Updating system..."
apt update && apt upgrade -y

echo "🐳 Step 2: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

echo "🐳 Step 3: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "📥 Step 4: Cloning repository..."
rm -rf /var/www/spaceidentity
mkdir -p /var/www/spaceidentity
cd /var/www/spaceidentity
git clone https://github.com/AryanMistry/uofthacks13.git .

echo "⚙️ Step 5: Creating environment file..."
cat > /var/www/spaceidentity/.env << EOF
GEMINI_API_KEY=GEMINI_KEY_PLACEHOLDER
VULTR_DEPLOYMENT=true
VULTR_OBJECT_STORAGE_HOSTNAME=STORAGE_HOST_PLACEHOLDER
VULTR_OBJECT_STORAGE_ACCESS_KEY=STORAGE_ACCESS_PLACEHOLDER
VULTR_OBJECT_STORAGE_SECRET_KEY=STORAGE_SECRET_PLACEHOLDER
VULTR_OBJECT_STORAGE_BUCKET=spaceidentity
NODE_ENV=production
EOF

echo "🔨 Step 6: Building Docker image..."
cd /var/www/spaceidentity
docker-compose build --no-cache

echo "🚀 Step 7: Starting application..."
docker-compose up -d

echo "🌐 Step 8: Installing Nginx..."
apt install -y nginx

cat > /etc/nginx/sites-available/spaceidentity << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        client_max_body_size 50M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/spaceidentity /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "🔥 Step 9: Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your app is running at: http://$(curl -s ifconfig.me)"
REMOTE_SCRIPT

# Replace placeholders with actual values
sed -i '' "s|GEMINI_KEY_PLACEHOLDER|$GEMINI_API_KEY|g" /tmp/vultr-setup.sh
sed -i '' "s|STORAGE_HOST_PLACEHOLDER|$VULTR_OBJECT_STORAGE_HOSTNAME|g" /tmp/vultr-setup.sh
sed -i '' "s|STORAGE_ACCESS_PLACEHOLDER|$VULTR_OBJECT_STORAGE_ACCESS_KEY|g" /tmp/vultr-setup.sh
sed -i '' "s|STORAGE_SECRET_PLACEHOLDER|$VULTR_OBJECT_STORAGE_SECRET_KEY|g" /tmp/vultr-setup.sh

echo "📤 Copying setup script to server..."
scp -o StrictHostKeyChecking=no /tmp/vultr-setup.sh $VULTR_USER@$VULTR_IP:/tmp/vultr-setup.sh

echo "🔧 Running setup on server..."
ssh -o StrictHostKeyChecking=no $VULTR_USER@$VULTR_IP "chmod +x /tmp/vultr-setup.sh && /tmp/vultr-setup.sh"

echo ""
echo "🎉 Done! Your app should be live at: http://$VULTR_IP"
