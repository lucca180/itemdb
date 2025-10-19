module.exports = {
  apps: [
    {
      name: 'itemdb-web',
      script: './node_modules/.bin/next',
      args: 'start -p 4000 -H 127.0.0.1',
      instances: '6',
      exec_mode: 'cluster',
      time: true,
      merge_logs: true,
      max_memory_restart: '2000M',
    },
    {
      name: 'itemdb-green',
      script: './node_modules/.bin/next',
      args: 'start -p 4000 -H 127.0.0.1',
      instances: '4',
      exec_mode: 'cluster',
      time: true,
      merge_logs: true,
      max_memory_restart: '2000M',
    },
  ],
};
