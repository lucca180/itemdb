# Blue/green deploy with PM2 and Nginx

This project uses a small blue/green deploy setup:

- `itemdb-web` runs from `/home/itemdb` on port `4000`;
- `itemdb-green` runs from `/home/itemdb-green` on port `4001`;
- Nginx sends traffic to the active port through a tiny snippet file;
- GitHub Actions updates, builds, and tests the inactive environment;
- after a local health check passes, the workflow updates the Nginx snippet and reloads Nginx;
- if the public health check fails, the workflow rolls back to the previous port.
- after the public health check passes, the workflow stops the previous PM2 process to avoid keeping an idle server running.

## Changes in this project

### PM2

`ecosystem.config.js` defines two processes. The current `itemdb-web` process stays as the blue environment to keep the migration small:

```js
{
  name: 'itemdb-web',
  args: 'start -p 4000 -H 127.0.0.1',
},
{
  name: 'itemdb-green',
  args: 'start -p 4001 -H 127.0.0.1',
}
```

Each process must be started from its own directory:

```bash
cd /home/itemdb
pm2 start ecosystem.config.js --only itemdb-web

cd /home/itemdb-green
pm2 start ecosystem.config.js --only itemdb-green
```

### Health check

The `/api/health` endpoint returns `200` when the Next.js server is responding:

```json
{
  "ok": true,
  "buildId": "commit-sha"
}
```

`/api/health/db` also probes the database (`SELECT 1`) and returns `503` when the connection pool cannot serve a query. The pool health watchdog uses this endpoint.

The deploy checks `/api/health` first through `127.0.0.1:<port>` and then through the public URL.

### GitHub Actions

The `.github/workflows/deploy.yml` workflow has a single deploy job with separate SSH steps. Each step resets the inactive clone to the exact commit that triggered the workflow.

The first step tests the inactive environment:

1. reads `/etc/nginx/snippets/itemdb-active-backend.conf`;
2. chooses the other port as the deploy target;
3. updates the target clone;
4. installs dependencies;
5. runs tests, unless the commit message contains `[skip test]`.

The second step only runs if tests pass:

1. reads the active Nginx snippet again;
2. chooses the inactive environment again;
3. updates the target clone to the same branch;
4. runs `yarn build-intl`, `yarn build`, and `yarn postbuild`;

The third step only runs if the build passes:

1. reads the active Nginx snippet again;
2. chooses the inactive environment again;
3. updates the target clone to the exact commit again;
4. runs `npx prisma migrate deploy`;
5. reloads or starts the target PM2 process;
6. waits briefly for startup;
7. checks `http://127.0.0.1:<port>/api/health` with retries;
8. prints PM2 status and recent logs if the target never becomes healthy, then stops the target process;
9. rewrites the Nginx snippet;
10. runs `sudo nginx -t` and `sudo systemctl reload nginx`;
11. checks the public health URL with retries;
12. if the public check fails, writes the previous port back to the snippet, reloads Nginx again, and stops the target process;
13. if the public check passes, stops the previous PM2 process.

By default, the public health URL is `https://itemdb.com.br/api/health`. For another domain, set the `PUBLIC_HEALTH_URL` GitHub Actions variable.

## Minimal Nginx configuration

In the site config, replace only the fixed `proxy_pass` with an include:

```nginx
location / {
  include /etc/nginx/snippets/itemdb-active-backend.conf;

  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

Create the initial snippet:

```bash
sudo mkdir -p /etc/nginx/snippets
echo "proxy_pass http://127.0.0.1:4000;" | sudo tee /etc/nginx/snippets/itemdb-active-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```

The deploy only rewrites this file:

```nginx
proxy_pass http://127.0.0.1:4000;
```

or:

```nginx
proxy_pass http://127.0.0.1:4001;
```

## Site-wide rate limiting (Cloudflare + Nginx)

Apply on the **server** (not in the blue/green snippet). Without restoring the real client IP, `$binary_remote_addr` is a Cloudflare edge IP and one bad client can throttle many users.

### 1. Separate file in the `http` context

Directives such as `set_real_ip_from` and `limit_req_zone` only work in the `http` block. Put them in a separate file and load it with `include`.

**Option A (recommended on Debian/Ubuntu):** create `/etc/nginx/conf.d/itemdb-rate-limit.conf`.  
Stock `nginx.conf` already includes this inside `http { ... }`:

```nginx
include /etc/nginx/conf.d/*.conf;
```

In that case you do **not** need to edit `nginx.conf` — only create the file.

**Option B:** another path with an explicit include:

```nginx
# inside http { } in /etc/nginx/nginx.conf
include /etc/nginx/snippets/itemdb-http-rate-limit.conf;
```

File contents (e.g. `/etc/nginx/conf.d/itemdb-rate-limit.conf`):

```nginx
# Cloudflare IP ranges: https://www.cloudflare.com/ips/
# Keep this list updated periodically.
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;

set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;

real_ip_header CF-Connecting-IP;
real_ip_recursive on;

# ~10 req/s sustained per client IP, with short burst for Next.js assets.
# One HTML page can fan out into many /_next/* requests.
limit_req_zone $binary_remote_addr zone=itemdb_site:20m rate=10r/s;
limit_req_status 429;
```

Do not put a `server { }` in this file — only `http`-level directives. `limit_req` still belongs on the site (`location /`).

### 2. Site `server` block — apply site-wide, exempt health checks

```nginx
server {
  # ... listen / server_name / ssl ...

  # Uptime + deploy health must not be rate-limited.
  location = /api/health {
    include /etc/nginx/snippets/itemdb-active-backend.conf;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location = /api/health/db {
    include /etc/nginx/snippets/itemdb-active-backend.conf;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Optional: static chunks are high-volume and cheap; skip limit if you see false 429s.
  # location ^~ /_next/static/ {
  #   include /etc/nginx/snippets/itemdb-active-backend.conf;
  #   proxy_set_header Host $host;
  #   proxy_set_header X-Real-IP $remote_addr;
  #   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  #   proxy_set_header X-Forwarded-Proto $scheme;
  # }

  location / {
    limit_req zone=itemdb_site burst=40 nodelay;

    include /etc/nginx/snippets/itemdb-active-backend.conf;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

If the site panel regenerates a `#PROXY-START/` … `#PROXY-END/` block, put `limit_req` inside that `location /`, and keep the health `location` blocks **outside** the managed section so they are not overwritten.

### 3. Apply

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Tune if needed:

- Too many false `429` on normal browsing → raise `burst` (e.g. `60`) or exempt `/_next/static/`
- Still too loose under crawl → lower to `rate=5r/s` and/or `burst=20`
- Deploy only rewrites `/etc/nginx/snippets/itemdb-active-backend.conf`; do **not** put `limit_req_zone` inside that snippet

## Required server permissions

The user used by GitHub Actions must be able to:

- read `/etc/nginx/snippets/itemdb-active-backend.conf`;
- write to that snippet through `sudo tee`;
- run `sudo nginx -t`;
- run `sudo systemctl reload nginx`;
- control the PM2 processes;
- update the clones in `/home/itemdb` and `/home/itemdb-green`.

Example sudoers entries for the Nginx commands:

```sudoers
deploy ALL=(root) NOPASSWD: /usr/sbin/nginx -t
deploy ALL=(root) NOPASSWD: /bin/systemctl reload nginx
deploy ALL=(root) NOPASSWD: /usr/bin/tee /etc/nginx/snippets/itemdb-active-backend.conf
```

Check the real paths on the server with:

```bash
which nginx
which systemctl
which tee
```

## New project: minimal setup

1. Create two clones on the server:

```bash
git clone git@github.com:org/app.git /home/app-blue
git clone git@github.com:org/app.git /home/app-green
```

2. Make the app accept a port through an environment variable or the PM2 command.

3. Create two PM2 processes, one on port `4000` and one on port `4001`.

4. Add a public health endpoint, for example `/api/health`.

5. Configure Nginx with the snippet include inside `location /`.

6. Create the initial snippet pointing to `4000`.

7. In the deploy workflow, detect the active port by reading the snippet.

8. Update and build the inactive clone.

9. Start or reload the inactive process.

10. Check the local health endpoint on the inactive port.

11. Rewrite the snippet to point to the new port.

12. Run `nginx -t` and reload Nginx.

13. Check the public health endpoint.

14. If it fails, write the previous port back to the snippet and reload Nginx.

15. If the local health check fails, print PM2 status/logs and stop the target process.

16. If the public health check fails, roll back the snippet and stop the failed target process.

17. If the public health check passes, stop the previous process to free CPU and memory.

## Database migrations

Blue/green deploys do not solve schema incompatibility by themselves. Migrations must be compatible with both the old version and the new version during the switch.

Prefer this flow:

1. first deploy: add fields, tables, or indexes without breaking the old code;
2. second deploy: make the new code use the new structure;
3. later deploy: remove old fields or code paths that are no longer used.

Avoid removing or renaming columns in the same deploy that publishes the new code.

## Pool health watchdog

If the MariaDB connection pool inside a PM2 worker becomes saturated (`pool timeout`), the app can stay unhealthy until workers are restarted. A cron-driven watchdog recovers automatically.

### How it detects the active stack

The script reads the same Nginx snippet as the deploy workflow:

```bash
/etc/nginx/snippets/itemdb-active-backend.conf
```

It parses `proxy_pass http://127.0.0.1:<port>;` and maps:

| Port | PM2 app      | Reload cwd          |
| ---- | ------------ | ------------------- |
| 4000 | `itemdb-web` | `/home/itemdb`      |
| 4001 | `itemdb-green` | `/home/itemdb-green` |

No manual `--app` / `--port` flags are required in cron.

### Health probe

`GET http://127.0.0.1:<active-port>/api/health/db` runs `SELECT 1` through Prisma. It returns `503` when the pool cannot serve a connection (the same failure mode as production incidents).

### Recovery action

After **3 consecutive unhealthy cycles** (default), with **≥ 2 failed probes per cycle** (of 6), the script runs:

```bash
pm2 reload ecosystem.config.js --only <active-app> --update-env
```

from the matching clone directory. A **15-minute cooldown** prevents reload loops.

### Cron example

```cron
*/2 * * * * cd /home/itemdb && tsx scripts/pool-health-watchdog.ts >> /var/log/itemdb-watchdog.log 2>&1
```

Dry run: `tsx scripts/pool-health-watchdog.ts --dry-run`

Environment: `NGINX_ACTIVE_BACKEND_CONF` — override snippet path (optional)

State and lock files (gitignored): `.pool-watchdog-state.json`, `.pool-watchdog.lock`

## Manual rollback

To manually roll back to blue:

```bash
echo "proxy_pass http://127.0.0.1:4000;" | sudo tee /etc/nginx/snippets/itemdb-active-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```

To manually roll back to green:

```bash
echo "proxy_pass http://127.0.0.1:4001;" | sudo tee /etc/nginx/snippets/itemdb-active-backend.conf
sudo nginx -t
sudo systemctl reload nginx
```
