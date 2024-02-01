module.exports = {
  apps: [
    {
      name: 'itemdb-web',
      script: './node_modules/.bin/next',
      args: 'start -p 4000',
      instances: 'max',
      exec_mode: 'cluster',
      time: true,
      merge_logs: true,
      max_memory_restart: '650M',
    },
  ],
};
