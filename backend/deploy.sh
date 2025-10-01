#!/bin/bash

# Production Deployment Script with Auto-Restart & Monitoring

echo "🚀 Starting Production Deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop existing processes
echo "⏹️ Stopping existing processes..."
pm2 stop event-manager-backend 2>/dev/null || true
pm2 delete event-manager-backend 2>/dev/null || true

# Start with PM2
echo "🔄 Starting backend with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup

echo "✅ Deployment complete!"
echo "📊 View logs: pm2 logs event-manager-backend"
echo "📈 Monitor: pm2 monit"
echo ""
echo "💡 Pro Tips:"
echo "  - Check health: curl http://localhost:5000/api/health"
echo "  - View stats: curl http://localhost:5000/api/stats"
echo "  - Restart: npm run pm2:restart"
echo "  - Stop: npm run pm2:stop"
