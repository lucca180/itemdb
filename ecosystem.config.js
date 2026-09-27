module.exports = {
  apps: [
    {
      name: 'itemdb-web',
      script: './node_modules/.bin/next',
      args: 'start -p 4000 -H 127.0.0.1',
      instances: '5',
      exec_mode: 'cluster',
      time: true,
      merge_logs: true,
      node_args: '--max-old-space-size=1536',
      max_memory_restart: '2800M',
      kill_timeout: 15_000,
      // PM2 7 calls process.setSourceMapsEnabled(true) by default, which makes Node keep every
      // server chunk's .map in the heap (~460MB/worker) → heap near limit → GC-bound CPU + restarts.
      disable_source_map_support: true,
      // glibc malloc fragments under Node threads + sharp (/_next/image): after a day ~0.5GB/worker of
      // RSS sat in malloc arenas beyond live Buffers. jemalloc returns freed pages to the OS.
      // Needs the `libjemalloc2` apt package; if the file is missing the loader warns and falls back.
      env: { LD_PRELOAD: '/lib/aarch64-linux-gnu/libjemalloc.so.2' },
    },
    {
      name: 'itemdb-green',
      script: './node_modules/.bin/next',
      args: 'start -p 4001 -H 127.0.0.1',
      instances: '5',
      exec_mode: 'cluster',
      time: true,
      merge_logs: true,
      node_args: '--max-old-space-size=1536',
      max_memory_restart: '2800M',
      kill_timeout: 15_000,
      disable_source_map_support: true,
      env: { LD_PRELOAD: '/lib/aarch64-linux-gnu/libjemalloc.so.2' },
    },
  ],
};
