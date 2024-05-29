module.exports = {
  apps: [
    {
      name: 'itemdb-web',
      script: './node_modules/.bin/next',
      args: 'start -p 4000',
      instances: '4',
      exec_mode: 'cluster',
      time: true,
      merge_logs: true,
      max_memory_restart: '600M',
    },
    {
      name: 'itemdb-maintenance',
      script: './node_modules/.bin/next',
      args: 'start -p 4000',
      instances: '1',
      exec_mode: 'fork',
      time: true,
      merge_logs: true,
      max_memory_restart: '100M',
      env: {
        MAINTENANCE_MODE: 'true',
      },
    },
  ],
};
