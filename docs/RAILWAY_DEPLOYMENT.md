# Railway Deployment Guide

Deploy the US National Address Platform (frontend + API + Postgres + Redis) on [Railway](https://railway.app) for about **$5/month** on the Hobby plan.

## Overview

You will create **one Railway project** with **four services**:

| Service    | Source              | Purpose                    |
|-----------|---------------------|----------------------------|
| **Postgres** | Railway plugin      | Database (PostGIS via extension) |
| **Redis**    | Railway plugin      | Queues / cache for the API |
| **API**      | `mes-adresses-api` | NestJS BAL API             |
| **Frontend** | `mes-adresses`     | Next.js editor             |

The API and Frontend are deployed from their **own Git repos** (or from the same repo with two services and different root directories). Postgres and Redis are added from the Railway dashboard.

**Railway CLI:** For running migrations, viewing logs, and managing variables from your machine, use the [Railway CLI](https://docs.railway.com/cli). Install with `brew install railway` or `npm i -g @railway/cli`, then `railway login` and `railway link` in your repo.

---

## 1. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (GitHub recommended).
2. **New Project** → choose **Empty Project** (or “Deploy from GitHub” and add one repo first; you can add the second service later).

---

## 2. Add Postgres (PostGIS) and Redis

The API uses **PostGIS** for geometry (e.g. `positions.point`). Railway’s default PostgreSQL image does **not** include PostGIS, so you must use the **PostGIS** template.

1. In the project, click **+ New** → **Database** → open **Templates** and choose **PostGIS** (not the plain “PostgreSQL” option). If you don’t see PostGIS under Database, use **+ New** → **Template** and search for “PostGIS”.
2. After it’s created, open the Postgres service → **Variables** and note the `DATABASE_URL` (or `POSTGRES_URL`; the API expects `POSTGRES_URL` — see step 4).
3. Click **+ New** → **Database** → **Redis**.
4. Note the Redis connection URL for the next step.

If you already created a **plain PostgreSQL** service, migrations will fail with `extension "postgis" is not available`. Create a new **PostGIS** database from the template, copy its public `DATABASE_URL`, run migrations against that URL, then point the API’s `POSTGRES_URL` to the new PostGIS database and remove or ignore the old Postgres service.

---

## 3. Deploy the API (`mes-adresses-api`)

1. **+ New** → **GitHub Repo** → select your `mes-adresses-api` repo (or the repo that contains it).
2. Railway will detect the app and use the repo’s `railway.toml` for build/start.
3. **Settings** → **Variables**: add or reference variables. Link the Postgres and Redis services so their URLs are injected, then map them as needed:
   - Ensure **`POSTGRES_URL`** is set (Railway often provides `DATABASE_URL`; if so, add a variable `POSTGRES_URL` = `${{Postgres.DATABASE_URL}}` or copy the value).
   - Ensure **`REDIS_URL`** is set (e.g. `${{Redis.REDIS_URL}}` or copy the Redis URL).
4. Add the rest of the API env vars (see **Environment variables** below). At minimum:
   - `API_URL` = your API’s public URL (e.g. `https://mes-adresses-api-production.up.railway.app` — you’ll get this after the first deploy).
   - `EDITOR_URL_PATTERN` = `https://<your-frontend-host>/bal/<id>/<token>` (use the frontend URL you’ll set in step 4).
   - `PORT` is usually set by Railway; the API uses it by default.
5. **Deploy**. After the first successful deploy, open the API service → **Settings** → **Networking** → **Generate Domain** to get the public URL. Set `API_URL` and `EDITOR_URL_PATTERN` to use this URL and your frontend URL, then redeploy if needed.
6. **Run migrations** (one-time, or after adding new migrations):
   - From your machine with the **public** Postgres URL: in Railway, open the **Postgres** service → **Variables** (or **Connect**) and copy the **public** `DATABASE_URL` (not the private `postgres.railway.internal` one). Then run `POSTGRES_URL='<paste-public-url>' yarn typeorm:migration:run` from `mes-adresses-api`. The private URL only works from inside Railway’s network (e.g. from a running deploy).
   - Or use Railway CLI with the API service’s variables: `railway run yarn typeorm:migration:run` (from `mes-adresses-api`). If you see `ENOTFOUND postgres.railway.internal`, the injected URL is private — use the public URL as above. Do not add `-- -d ./typeorm.config.ts`; the script already passes it.

---

## 4. Deploy the Frontend (`mes-adresses`)

1. In the same project, **+ New** → **GitHub Repo** → select your `mes-adresses` repo.
2. Railway will use the repo’s `railway.toml` for build/start.
3. **Settings** → **Variables**: set at least:
   - `NEXT_PUBLIC_EDITEUR_URL` = your frontend’s public URL (e.g. `https://mes-adresses-production.up.railway.app` — again, generate domain after first deploy).
   - `NEXT_PUBLIC_BAL_API_URL` = API base URL + `/v2` (e.g. `https://mes-adresses-api-production.up.railway.app/v2`).
   - Optionally set map/parcel/ortho vars (see **Environment variables** below).
4. **Deploy** → then **Settings** → **Networking** → **Generate Domain**.
5. Go back to the **API** service and set `EDITOR_URL_PATTERN` to use this frontend URL: `https://<frontend-domain>/bal/<id>/<token>`. Redeploy the API if you changed variables.

---

## 5. Environment variables reference

### API (`mes-adresses-api`)

| Variable | Required | Example / notes |
|----------|----------|------------------|
| `POSTGRES_URL` | Yes | From Railway Postgres (e.g. `${{Postgres.DATABASE_URL}}`) |
| `REDIS_URL` | Yes | From Railway Redis |
| `PORT` | No | Set by Railway |
| `API_URL` | Yes (prod) | Public API URL, e.g. `https://mes-adresses-api-xxx.up.railway.app` |
| `EDITOR_URL_PATTERN` | Yes (prod) | `https://<frontend-domain>/bal/<id>/<token>` |
| `SMTP_*` | No | Leave empty for dev (emails logged to console) |
| `S3_*` | No | Only if you use generated files / exports |
| `API_DEPOT_URL`, `BAN_API_URL`, etc. | No | Optional integrations; leave empty if not used |

See [mes-adresses-api/.env.sample](../mes-adresses-api/.env.sample) for the full list.

### Frontend (`mes-adresses`)

| Variable | Required | Example / notes |
|----------|----------|------------------|
| `NEXT_PUBLIC_EDITEUR_URL` | Yes | Public frontend URL |
| `NEXT_PUBLIC_BAL_API_URL` | Yes | API URL + `/v2` |
| `PORT` | No | Set by Railway (Next.js uses it) |
| `NEXT_PUBLIC_MAP_TILES_URL` | No | Default Stadia style if unset |
| `NEXT_PUBLIC_MAP_GLYPHS_URL` | No | Default Stadia glyphs if unset |
| `NEXT_PUBLIC_ORTHO_TILES_URL` | No | Optional aerial imagery |
| `NEXT_PUBLIC_PARCEL_TILES_URL` | No | Optional parcel layer |

See [mes-adresses/.env.sample](../mes-adresses/.env.sample) for the full list.

---

## 5b. Pre-launch checklist

Use this to verify everything is set correctly (no automated check — run through in the Railway dashboard and browser).

**API (`mes-adresses-api`)**

| Check | What to verify |
|-------|----------------|
| **POSTGRES_URL** | Points to your **PostGIS** (or Postgres-with-PostGIS) database. Same host/URL as the service where you ran migrations (e.g. `shortline.proxy.rlwy.net` for PostGIS). Not the old plain Postgres if you have both. |
| **REDIS_URL** | Set and uses the **private** Redis URL (e.g. `${{Redis.REDIS_URL}}` or `${{Redis.REDIS_PRIVATE_URL}}`). Avoid using the public Redis URL from outside Railway to prevent ETIMEDOUT and egress. |
| **API_URL** | Your API’s **public** URL (e.g. `https://mes-adresses-api-production.up.railway.app`). |
| **EDITOR_URL_PATTERN** | `https://<your-frontend-domain>/bal/<id>/<token>` with your real frontend domain. |
| **Start command** | `node dist/apps/api/main.js` (no `railway run` or migration command). |
| **Deploy status** | Latest deployment **Success**; Deploy Logs show “Nest application successfully started” and no Redis ETIMEDOUT. |

**Frontend (`mes-adresses`)**

| Check | What to verify |
|-------|----------------|
| **NEXT_PUBLIC_BAL_API_URL** | API public URL + `/v2` (e.g. `https://mes-adresses-api-production.up.railway.app/v2`). |
| **NEXT_PUBLIC_EDITEUR_URL** | Your frontend’s **public** URL (e.g. `https://mes-adresses-production.up.railway.app`). |
| **Deploy status** | Latest deployment **Success**. |

**Smoke test**

1. Open the **API** URL in a browser (e.g. `https://<api-domain>/` or `/v2`). You should get a response (e.g. 404 or JSON), not 502.
2. Open the **frontend** URL. The app should load; try opening or creating a BAL so the frontend talks to the API.

---

## 6. Custom domain (optional)

For each service (API and Frontend):

1. Open the service → **Settings** → **Networking** → **Custom Domain**.
2. Add your domain and follow Railway’s DNS instructions (CNAME to the given target).

Then update `API_URL`, `EDITOR_URL_PATTERN`, `NEXT_PUBLIC_EDITEUR_URL`, and `NEXT_PUBLIC_BAL_API_URL` to use the custom domains and redeploy.

---

## 7. Cost and limits

- **Hobby plan**: about **$5/month**, including **$5 usage credit**. Usage (vCPU, RAM, egress) is deducted from that credit; if you stay under $5, you pay only the subscription.
- Postgres and Redis on Railway consume part of that credit; for a low-traffic dev or staging environment, the total often stays within $5.
- Monitor usage in the Railway dashboard and set a spending limit if desired.

---

## 8. Using the Railway API (optional)

You can automate part of the setup with the [Railway GraphQL API](https://docs.railway.com/reference/public-api).

1. **Create an API token**: [railway.app/account/tokens](https://railway.app/account/tokens) — use an **Account** or **Workspace** token (not a project token, so you can create projects and services).

2. **Add Postgres and Redis first** in the dashboard (the API does not expose a simple “add database” flow for all plans; creating them in the UI is reliable).

3. **Run the setup script** from the repo root (with your own env vars):

   ```bash
   export RAILWAY_TOKEN=your_token_here
   export GITHUB_OWNER=your-github-org-or-username
   export GITHUB_REPO_API=your-org/mes-adresses-api
   export GITHUB_REPO_FRONTEND=your-org/mes-adresses
   export GITHUB_BRANCH=us-port   # or main

   # Optional: use an existing project instead of creating one
   # export RAILWAY_PROJECT_ID=existing-project-id

   # Optional: monorepo with subdirs
   # export API_ROOT_DIR=mes-adresses-api
   # export FRONTEND_ROOT_DIR=mes-adresses

   node scripts/railway-setup.mjs
   ```

   The script will:
   - Create a new project (or use `RAILWAY_PROJECT_ID` if set).
   - Create **API** and **Frontend** services from your GitHub repos.
   - Generate public domains for both.
   - Set variables (API: `POSTGRES_URL`, `REDIS_URL`, `API_URL`, `EDITOR_URL_PATTERN`; Frontend: `NEXT_PUBLIC_EDITEUR_URL`, `NEXT_PUBLIC_BAL_API_URL`).
   - Trigger the first deploy for both services.

   **Important:** Variable references assume your Postgres and Redis services are named exactly **Postgres** and **Redis** in the project (e.g. `${{Postgres.DATABASE_URL}}`). If you used different names, set `POSTGRES_URL` and `REDIS_URL` in the API service in the dashboard after the script runs.

4. **If the script fails**: Railway’s GraphQL schema can change. Use [railway.com/graphiql](https://railway.com/graphiql) with your token to inspect mutations (`projectCreate`, `serviceCreate`, `serviceDomainCreate`, `variableCollectionUpsert`, `deploymentTrigger`). You can also do the same steps manually in the dashboard (see sections 1–5 above).

5. **Migrations**: After the first successful API deploy, run migrations once (see step 3 in the main guide).

---

## 9. Troubleshooting

- **502 Bad Gateway** when opening the API URL (even though Deploy Logs show “Nest application successfully started”): (1) The app must listen on `0.0.0.0` and use `process.env.PORT` — the API’s `main.ts` does both and logs “Listening on 0.0.0.0:&lt;port&gt;” after start. (2) In **mes-adresses-api** → **Settings** → **Networking** (or **Deploy**), check that the **target port** (or “Port”) matches what the app uses — Railway sets the `PORT` env var; the proxy must forward to that same port. If there is a “Port” override, leave it empty so Railway uses the `PORT` from the environment. (3) Start Command must be exactly `node dist/apps/api/main.js`. (4) If it still 502s, try **Redeploy** or open a ticket with Railway support with your deployment ID.
- **"railway: command not found" / container crashes on start**: The container is trying to run the `railway` CLI, which only exists on your machine, not inside the deploy. Fix: open the API service in Railway → **Settings** → **Deploy** (or **Build & Deploy**). Clear any **Start Command** or **Pre-Deploy Command** that contains `railway run` or `railway`. The start command should be only `node dist/apps/api/main.js` (or leave it empty so `railway.toml` is used). Run migrations from your **local** machine with `railway run yarn typeorm:migration:run` (see step 6 in section 3).
- **API fails to start**: Check that `POSTGRES_URL` and `REDIS_URL` are set and that migrations have been run at least once.
- **API_URL is localhost**: If `API_URL` is `http://localhost:5000`, the API will generate wrong links. Set it to your **public** API URL (e.g. `https://mes-adresses-api-production.up.railway.app`) in the API service Variables.
- **Redis `connect ETIMEDOUT`** (in Deploy Logs): The API cannot reach Redis. Fix: (1) In **mes-adresses-api** → **Variables**, set **REDIS_URL** via the variable reference `${{Redis.REDIS_URL}}` so Railway links the services. (2) Ensure the **Redis** service is in the same Railway project and is **Online**. (3) The codebase forces IPv4 (`family: 4`) for Redis when the URL host is `railway.internal`; push the latest API code and redeploy. (4) **If it still fails:** use the **public** Redis URL so the API can start. In the **Redis** service → **Variables**, copy the value of **REDIS_PUBLIC_URL**. In **mes-adresses-api** → **Variables**, set **REDIS_URL** to that value (paste it, or use `${{Redis.REDIS_PUBLIC_URL}}` if available). Redeploy. This may incur egress but unblocks the 502.
- **Frontend can’t reach API**: Ensure `NEXT_PUBLIC_BAL_API_URL` is the **public** API URL (including `/v2`) and that the API service has a generated (or custom) domain.
- **Links in emails point to wrong URL**: Set `EDITOR_URL_PATTERN` and `API_URL` on the API to the correct public frontend and API URLs.
- **PostGIS errors**: Run `CREATE EXTENSION IF NOT EXISTS postgis;` in the Postgres database (see step 2).
- **"type habilitations_status_enum already exists"**: The migration was made idempotent; run `yarn typeorm:migration:run` again (with the same `POSTGRES_URL`). If it still fails, the migration may already be recorded — check the `migrations` table in the DB.
