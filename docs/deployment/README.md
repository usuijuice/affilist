# Deployment Guide

This guide covers deploying the Affiliate Link Aggregator application to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn package manager
- Git

### Development Tools

- Docker (optional, for containerized deployment)
- PM2 (for production process management)
- Nginx (for reverse proxy and static file serving)

## Environment Configuration

### Environment Variables

Create environment files for each deployment stage:

#### Frontend (.env.production)
```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_APP_NAME=Affilist
VITE_APP_VERSION=1.0.0

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_HOTJAR_ID=HOTJAR_ID

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
```

#### Backend (.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://username:password@host:5432/database_name
DATABASE_SSL=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Email (optional, for notifications)
SMTP_HOST=smtp.yourmailprovider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

## Database Setup

### PostgreSQL Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Docker
```bash
docker run --name affilist-postgres \
  -e POSTGRES_DB=affilist \
  -e POSTGRES_USER=affilist \
  -e POSTGRES_PASSWORD=your-password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15
```

### Database Configuration

1. Create database and user:
```sql
CREATE DATABASE affilist;
CREATE USER affilist WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE affilist TO affilist;
```

2. Run migrations:
```bash
cd server
npm run migrate
```

3. Seed initial data (optional):
```bash
npm run seed
```

## Frontend Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build

# The built files will be in the 'dist' directory
```

### Static Hosting Options

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel --prod`
3. Configure environment variables in Vercel dashboard

#### Netlify
1. Connect your Git repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Configure environment variables in Netlify dashboard

#### AWS S3 + CloudFront
```bash
# Install AWS CLI and configure credentials
aws configure

# Sync build files to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/affilist/dist;
    index index.html;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## Backend Deployment

### Node.js Server Setup

#### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'affilist-api',
    script: 'dist/index.js',
    cwd: '/path/to/your/server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true
  }]
};
EOF

# Start the application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Using Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
```

```bash
# Build and run
docker build -t affilist-api .
docker run -d \
  --name affilist-api \
  -p 3000:3000 \
  --env-file .env.production \
  affilist-api
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://affilist:password@db:5432/affilist
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=affilist
      - POSTGRES_USER=affilist
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

### Cloud Platform Deployment

#### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Render
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Configure environment variables

#### AWS EC2
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup application
git clone https://github.com/yourusername/affilist.git
cd affilist/server
npm install
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Production Considerations

### Security

1. **HTTPS Configuration**
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

2. **Firewall Setup**
```bash
# UFW configuration
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

3. **Security Headers**
```nginx
# Add to Nginx configuration
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### Performance Optimization

1. **Database Optimization**
```sql
-- Add indexes for better query performance
CREATE INDEX idx_affiliate_links_category_id ON affiliate_links(category_id);
CREATE INDEX idx_affiliate_links_featured ON affiliate_links(featured);
CREATE INDEX idx_affiliate_links_status ON affiliate_links(status);
CREATE INDEX idx_click_events_link_id ON click_events(link_id);
CREATE INDEX idx_click_events_timestamp ON click_events(timestamp);
```

2. **Caching Strategy**
```javascript
// Redis configuration (optional)
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});
```

3. **CDN Configuration**
- Use CloudFront, CloudFlare, or similar CDN
- Configure proper cache headers
- Optimize images and static assets

### Backup Strategy

1. **Database Backups**
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/affilist_$DATE.sql
find $BACKUP_DIR -name "affilist_*.sql" -mtime +7 -delete
```

2. **Automated Backups**
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

## Monitoring and Logging

### Application Monitoring

1. **PM2 Monitoring**
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart affilist-api
```

2. **Health Checks**
```javascript
// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});
```

### Log Management

1. **Log Rotation**
```bash
# Install logrotate
sudo apt install logrotate

# Configure log rotation
cat > /etc/logrotate.d/affilist << EOF
/path/to/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
```

2. **Centralized Logging** (Optional)
- Use ELK Stack (Elasticsearch, Logstash, Kibana)
- Or cloud solutions like AWS CloudWatch, Google Cloud Logging

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
```bash
# Check database status
sudo systemctl status postgresql

# Check connection
psql $DATABASE_URL -c "SELECT 1;"
```

2. **Port Already in Use**
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

3. **Permission Issues**
```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/affilist
sudo chmod -R 755 /var/www/affilist
```

4. **Memory Issues**
```bash
# Check memory usage
free -h
pm2 show affilist-api

# Restart if needed
pm2 restart affilist-api
```

### Performance Issues

1. **Database Performance**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

2. **Application Performance**
```bash
# Monitor with PM2
pm2 monit

# Check logs for errors
pm2 logs --lines 100
```

### Rollback Procedure

1. **Application Rollback**
```bash
# Using PM2
pm2 stop affilist-api
git checkout previous-stable-tag
npm install
npm run build
pm2 start affilist-api
```

2. **Database Rollback**
```bash
# Restore from backup
psql $DATABASE_URL < /backups/affilist_backup.sql
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**
```bash
# Check for updates
npm outdated

# Update packages
npm update
```

2. **Security Updates**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

3. **Database Maintenance**
```sql
-- Analyze tables
ANALYZE;

-- Vacuum tables
VACUUM ANALYZE;
```

### Monitoring Checklist

- [ ] Application is responding to health checks
- [ ] Database connections are stable
- [ ] Disk space is sufficient
- [ ] Memory usage is within limits
- [ ] SSL certificates are valid
- [ ] Backups are running successfully
- [ ] Logs are being rotated properly
- [ ] Security updates are applied