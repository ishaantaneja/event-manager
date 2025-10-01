module.exports = {
  apps: [{
    name: 'event-manager-backend',
    script: './src/server.js',
    instances: 1, // Use 'max' for cluster mode
    exec_mode: 'fork', // Change to 'cluster' for multiple instances
    autorestart: true,
    watch: false, // Set to true in development
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Advanced features
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    merge_logs: true,
    
    // Auto-restart on file changes (development)
    ignore_watch: ['node_modules', 'logs'],
    
    // Memory optimization
    node_args: '--max-old-space-size=1024'
  }]
};
