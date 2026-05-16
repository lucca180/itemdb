# Blue/green deploy with PM2 and Nginx

This project uses a small blue/green deploy setup:

- `itemdb-web` runs from `/home/itemdb` on port `4000`;
- `itemdb-green` runs from `/home/itemdb-green` on port `4001`;
- Nginx sends traffic to the active port through a tiny snippet file;
- GitHub Actions updates, builds, and tests the inactive environment;
- after a local health check passes, the workflow updates the Nginx snippet and reloads Nginx;
- if the public health check fails, the workflow rolls back to the previous port.

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

The deploy checks this endpoint first through `127.0.0.1:<port>` and then through the public URL.

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
6. checks `http://127.0.0.1:<port>/api/health`;
7. rewrites the Nginx snippet;
8. runs `sudo nginx -t` and `sudo systemctl reload nginx`;
9. checks the public health URL;
10. if the public check fails, writes the previous port back to the snippet and reloads Nginx again.

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

## Database migrations

Blue/green deploys do not solve schema incompatibility by themselves. Migrations must be compatible with both the old version and the new version during the switch.

Prefer this flow:

1. first deploy: add fields, tables, or indexes without breaking the old code;
2. second deploy: make the new code use the new structure;
3. later deploy: remove old fields or code paths that are no longer used.

Avoid removing or renaming columns in the same deploy that publishes the new code.

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
