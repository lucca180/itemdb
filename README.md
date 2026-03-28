# itemdb - Neopets Open-Source item database

[itemdb](https://itemdb.com.br/) is a database of information about Neopets items. It is built using **Next.js**, **MySQL** and **[Prisma](https://www.prisma.io/docs)**

## Running Locally

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (for the database)
- Node.js 22+
- Yarn

### First-time setup

**1. Clone the repo and install dependencies**

```bash
git clone https://github.com/lucca180/itemdb.git
cd itemdb
yarn
npx prisma generate
```

**2. Configure environment variables**

```bash
cp .env.default .env.local
```

The defaults in `.env.local` work out of the box with the Docker database. No changes are needed for a basic local setup. See [.env.default](.env.default) for optional features (image uploads, Redis, email, etc.).

**3. Start the database**

```bash
docker compose up -d
```

This starts a MariaDB 11 container (`itemdb-db`) on `localhost:3306`.

**4. Run database migrations**

```bash
npx prisma migrate dev
```

**5. Seed the database**

The seed script creates two local test users and optionally imports item data dumps.

```bash
npx prisma db seed
```

To also import item data, download the dumps from the [Public Data](https://itemdb.com.br/public-data) page and place them inside the `prisma/` folder. The seed will automatically detect and import files named in this format, in this order:

```
prisma/items_<timestamp>.sql
prisma/itemcolor_<timestamp>.sql
prisma/itemprices_<timestamp>.sql
```

The Docker container must be running when the seed executes.

**6. Start the app**

```bash
yarn dev
```

Your local copy of itemdb will be available at [http://localhost:3000](http://localhost:3000).

### Test accounts

After seeding, two accounts are available — use the magic-link login flow (the link is printed to your terminal):

| Email | Role |
|---|---|
| `admin@itemdb.dev` | ADMIN |
| `user@itemdb.dev` | USER |

### Accessing the database directly

```bash
# MariaDB CLI inside the container
docker exec -it itemdb-db mariadb -u db_user -pdb_pass itemdb

# Or connect any GUI client (TablePlus, DBeaver, etc.) to:
# Host: localhost  Port: 3306  User: db_user  Password: db_pass  Database: itemdb
```

If you want to test something that isn't disclosed here you can reach us via [Feedback](https://itemdb.com.br/feedback)