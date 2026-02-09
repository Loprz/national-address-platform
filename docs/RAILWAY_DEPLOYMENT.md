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

---

## 1. Create a Railway project

1. Go to [railway.app](https://railway.app) and sign in (GitHub recommended).
2. **New Project** → choose **Empty Project** (or “Deploy from GitHub” and add one repo first; you can add the second service later).

---

## 2. Add Postgres and Redis

1. In the project, click **+ New** → **Database** → **PostgreSQL**.
2. After it’s created, open the Postgres service → **Variables** and note the `DATABASE_URL` (Railway may name it `POSTGRES_URL` or `DATABASE_URL`; the API expects `POSTGRES_URL` — see step 4).
3. Click **+ New** → **Database** → **Redis**.
4. Note the Redis connection URL for the next step.

(Optional) Enable **PostGIS** on Postgres: in the Postgres service, open the **Data** or **Query** tab and run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

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
   - Railway CLI: `railway run yarn typeorm:migration:run -- -d ./typeorm.config.ts` (from the `mes-adresses-api` directory, with `railway link` to this project/service).
   - Or from your machine with `POSTGRES_URL` set to the Railway Postgres URL: `yarn typeorm:migration:run -- -d ./typeorm.config.ts`.

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

## 8. Troubleshooting

- **API fails to start**: Check that `POSTGRES_URL` and `REDIS_URL` are set and that migrations have been run at least once.
- **Frontend can’t reach API**: Ensure `NEXT_PUBLIC_BAL_API_URL` is the **public** API URL (including `/v2`) and that the API service has a generated (or custom) domain.
- **Links in emails point to wrong URL**: Set `EDITOR_URL_PATTERN` and `API_URL` on the API to the correct public frontend and API URLs.
- **PostGIS errors**: Run `CREATE EXTENSION IF NOT EXISTS postgis;` in the Postgres database (see step 2).
