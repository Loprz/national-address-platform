# National Address Platform (NAP) — Project Rules

## What This Project Is
We are porting France's Base Adresse Nationale (BAN) to the United States. The goal is a 1:1 functional replica first, then US adaptation. All work happens on `us-port` branches.

## Key Documents (Always Reference These)
- `PROJECT_RESEARCH_AND_PLAN.md` — Full research, architecture, roadmap
- `LAB_SPEC_v1.0.md` — Local Address Base format spec (our minimal schema)
- `README.md` — Project overview

## Repository Structure
Each subdirectory is its own git repo (forked from BaseAdresseNationale):
- `mes-adresses/` — Editor UX (Next.js/TypeScript) — **Start here for UI work**
- `mes-adresses-api/` — Backend API (NestJS/TypeScript)
- `api-depot/` — Submission pipeline (NestJS/TypeScript)
- `adresse.data.gouv.fr/` — Public website (Next.js/TypeScript)
- `ban-plateforme/` — Integration engine (Express.js/JavaScript)
- `addok-docker/` — Geocoder (Python/Docker)

## Design Philosophy
1. **Minimal schema first** — 12 required fields (LAB format), derive everything else
2. **1:1 port before innovation** — Get the French system working with US data first
3. **Lower barriers to entry** — If a county clerk can't use it, we failed
4. **English primary, Spanish alternate** — Use `next-intl` for i18n throughout
