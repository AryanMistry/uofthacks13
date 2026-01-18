# 🚀 SpaceIdentity - Vultr Deployment Guide

> **Built for UofTHacks 13 - Best Use of Vultr**

This guide walks you through deploying SpaceIdentity on Vultr's cloud infrastructure, leveraging multiple Vultr services for a production-ready AI-powered room redesign platform.

## 🏗️ Vultr Services Used

| Service | Purpose |
|---------|---------|
| **Cloud Compute** | Hosts the Next.js application |
| **Object Storage** | Stores room images and generated designs |
| **Load Balancer** | (Optional) For high availability |
| **DNS** | (Optional) Domain management |

---

## 📋 Prerequisites

1. A [Vultr account](https://www.vultr.com/)
2. A domain name (optional, but recommended)
3. A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## 🖥️ Step 1: Create a Vultr Cloud Compute Instance

1. Log into [Vultr Dashboard](https://my.vultr.com/)
2. Click **"Deploy +"** → **"Cloud Compute"**
3. Configure your instance:

   | Setting | Recommended Value |
   |---------|-------------------|
   | **Location** | Choose closest to your users |
   | **Image** | Ubuntu 24.04 LTS |
   | **Plan** | High Frequency, 2 vCPU, 4GB RAM ($24/mo) |
   | **SSH Keys** | Add your SSH public key |
   | **Hostname** | `spaceidentity` |

4. Click **"Deploy Now"**
5. Wait for the instance to be ready (usually 1-2 minutes)
6. Note the **IP address**

---

## 📦 Step 2: Set Up Vultr Object Storage (Optional but Recommended)

1. In Vultr Dashboard, go to **"Products"** → **"Object Storage"**
2. Click **"Add Object Storage"**
3. Choose the same region as your compute instance
4. Note down:
   - **Hostname** (e.g., `ewr1.vultrobjects.com`)
   - **Access Key**
   - **Secret Key**
5. Create a bucket named `spaceidentity`

---

## 🔧 Step 3: Deploy the Application

### Option A: Automated Deployment (Recommended)

SSH into your Vultr instance:

```bash
ssh root@YOUR_VULTR_IP
```

Run the deployment script:

```bash
# Clone the repository
git clone https://github.com/AryanMistry/uofthacks13.git /var/www/spaceidentity
cd /var/www/spaceidentity

# Set your environment variables
export DOMAIN="your-domain.com"  # or use the IP address
export GEMINI_API_KEY="your-gemini-api-key"

# Optional: Vultr Object Storage
export VULTR_OBJECT_STORAGE_HOSTNAME="ewr1.vultrobjects.com"
export VULTR_OBJECT_STORAGE_ACCESS_KEY="your-access-key"
export VULTR_OBJECT_STORAGE_SECRET_KEY="your-secret-key"

# Run the deployment script
chmod +x vultr-deploy.sh
sudo -E ./vultr-deploy.sh
```

### Option B: Manual Deployment

<details>
<summary>Click to expand manual steps</summary>

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker && systemctl start docker

# 3. Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/AryanMistry/uofthacks13.git /var/www/spaceidentity
cd /var/www/spaceidentity

# 5. Create environment file
cat > .env << EOF
GEMINI_API_KEY=your-gemini-api-key
VULTR_DEPLOYMENT=true
VULTR_OBJECT_STORAGE_HOSTNAME=ewr1.vultrobjects.com
VULTR_OBJECT_STORAGE_ACCESS_KEY=your-access-key
VULTR_OBJECT_STORAGE_SECRET_KEY=your-secret-key
EOF

# 6. Build and run
docker-compose up -d --build

# 7. Install and configure Nginx
apt install -y nginx
# ... (see vultr-deploy.sh for full nginx config)
```

</details>

---

## 🔒 Step 4: Enable HTTPS with Let's Encrypt

Once your domain's DNS is pointing to your Vultr IP:

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 🌐 Step 5: Configure DNS (Optional)

If you have a domain:

1. In Vultr Dashboard, go to **"DNS"**
2. Add your domain
3. Create records:
   - **A Record**: `@` → Your Vultr IP
   - **A Record**: `www` → Your Vultr IP

Or use your domain registrar's DNS settings.

---

## ⚖️ Step 6: Add Load Balancer (Optional, for Production)

For high availability:

1. Go to **"Products"** → **"Load Balancers"**
2. Click **"Add Load Balancer"**
3. Configure:
   - **Region**: Same as your compute instance
   - **Forwarding Rules**: HTTP 80 → 3000, HTTPS 443 → 3000
   - **Health Checks**: HTTP on port 3000, path `/`
4. Attach your compute instance

---

## 📊 Architecture Diagram

```
                    ┌─────────────────┐
                    │   Users/Web     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Vultr DNS      │
                    │  (Optional)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Load Balancer   │
                    │  (Optional)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────────┐     │     ┌────────▼────────┐
     │  Cloud Compute  │     │     │  Cloud Compute  │
     │   (Primary)     │     │     │   (Replica)     │
     │                 │     │     │   (Optional)    │
     │  ┌───────────┐  │     │     └─────────────────┘
     │  │  Docker   │  │     │
     │  │  Next.js  │  │     │
     │  │  App      │  │     │
     │  └───────────┘  │     │
     └────────┬────────┘     │
              │              │
              │    ┌─────────▼─────────┐
              │    │  Vultr Object     │
              └────►  Storage          │
                   │  (Images/Assets)  │
                   └───────────────────┘
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI features |
| `VULTR_DEPLOYMENT` | No | Set to `true` when deployed on Vultr |
| `VULTR_OBJECT_STORAGE_HOSTNAME` | No | Vultr Object Storage hostname |
| `VULTR_OBJECT_STORAGE_ACCESS_KEY` | No | Object Storage access key |
| `VULTR_OBJECT_STORAGE_SECRET_KEY` | No | Object Storage secret key |
| `VULTR_OBJECT_STORAGE_BUCKET` | No | Bucket name (default: `spaceidentity`) |

---

## 🛠️ Useful Commands

```bash
# View application logs
docker-compose logs -f

# Restart the application
docker-compose restart

# Stop the application
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Check container status
docker ps

# View nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🐛 Troubleshooting

### Container won't start
```bash
docker-compose logs spaceidentity
```

### Nginx 502 Bad Gateway
```bash
# Check if container is running
docker ps

# Check if port 3000 is accessible
curl http://localhost:3000
```

### SSL certificate issues
```bash
sudo certbot renew --dry-run
```

### Out of memory
Consider upgrading to a larger Vultr plan or adding swap:
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 💰 Estimated Costs

| Service | Monthly Cost |
|---------|-------------|
| Cloud Compute (2 vCPU, 4GB) | $24 |
| Object Storage (250GB) | $5 |
| Load Balancer (optional) | $10 |
| **Total** | **$29-39/month** |

*Vultr offers $100 free credit for new accounts!*

---

## 🏆 Why Vultr for This Project?

1. **Global Infrastructure**: 32 data center locations for low latency
2. **High-Performance Compute**: NVMe SSD storage, high-frequency CPUs
3. **S3-Compatible Object Storage**: Perfect for storing room images
4. **Simple Pricing**: No hidden fees, pay-as-you-go
5. **Docker-Friendly**: Easy container deployment
6. **Great for Hackathons**: Quick setup, reliable performance

---

## 📚 Resources

- [Vultr Documentation](https://www.vultr.com/docs/)
- [Vultr API Reference](https://www.vultr.com/api/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/)

---

Made with ❤️ for UofTHacks 13
