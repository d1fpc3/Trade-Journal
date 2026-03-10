module.exports = {
  apps: [
    {
      name: 'trade-journal',
      script: 'server/index.js',
      node_args: '--experimental-sqlite',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
    },
  ],
};
