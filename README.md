# National Address Platform (NAP)

**Porting France's [Base Adresse Nationale](https://github.com/BaseAdresseNationale/) to the United States**

A free, open-source platform for managing, publishing, and geocoding every address in the United States. Built to support the [National Address Database (NAD)](https://www.transportation.gov/gis/national-address-database), [US Census Bureau](https://www.census.gov/), [NG911](https://www.nena.org/page/NG911Standards), and statewide address programs.

**Languages**: English (primary) | Spanish (alternate)

---

## Why This Exists

The US has ~150 million address points scattered across 90,000+ jurisdictions with no unified, interactive, open-source platform for managing them. France solved this exact problem with the Base Adresse Nationale (BAN) — a minimal-schema approach that got 27,000+ municipalities contributing data using a simple web editor and a ~15-field CSV format.

We're porting that system to the US, starting with a 1:1 functional replica and adapting it for American addressing standards.

## Architecture

This project consists of 6 components, each forked from the French BAN system:

| Component | Description | Upstream | Fork |
|-----------|-------------|----------|------|
| **[Public Website](adresse.data.gouv.fr/)** | National address search, map explorer, data downloads | [adresse.data.gouv.fr](https://github.com/BaseAdresseNationale/adresse.data.gouv.fr) | [Loprz fork](https://github.com/Loprz/adresse.data.gouv.fr) |
| **[My Addresses (Editor)](mes-adresses/)** | No-code web tool for local authorities to manage addresses | [mes-adresses](https://github.com/BaseAdresseNationale/mes-adresses) | [Loprz fork](https://github.com/Loprz/mes-adresses) |
| **[My Addresses API](mes-adresses-api/)** | Backend API for address CRUD, auth, publishing | [mes-adresses-api](https://github.com/BaseAdresseNationale/mes-adresses-api) | [Loprz fork](https://github.com/Loprz/mes-adresses-api) |
| **[Address Depot API](api-depot/)** | Versioned submission pipeline for local-to-national data flow | [api-depot](https://github.com/BaseAdresseNationale/api-depot) | [Loprz fork](https://github.com/Loprz/api-depot) |
| **[NAP Engine](ban-plateforme/)** | Data integration, consolidation, and export platform | [ban-plateforme](https://github.com/BaseAdresseNationale/ban-plateforme) | [Loprz fork](https://github.com/Loprz/ban-plateforme) |
| **[Geocoder](addok-docker/)** | Open-source geocoding engine (Docker-deployable) | [addok-docker](https://github.com/BaseAdresseNationale/addok-docker) | [Loprz fork](https://github.com/Loprz/addok-docker) |

All work happens on the `us-port` branch of each fork.

## Quick Start (Local Development)

```bash
# 1. Start database services (PostgreSQL + PostGIS, Redis)
docker compose up -d

# 2. Set up the backend API
cd mes-adresses-api
cp .env.sample .env
yarn install
yarn typeorm:migration:run   # Apply database schema
yarn dev:api                  # Starts on http://localhost:5050

# 3. Set up the frontend editor
cd ../mes-adresses
cp .env.sample .env
yarn install
yarn dev                      # Starts on http://localhost:3000

# 4. Test it works
curl -X POST http://localhost:5050/v2/bases-locales/create-demo \
  -H "Content-Type: application/json" \
  -d '{"commune": "06037"}'
# Returns: { "nom": "Addresses of Los Angeles County, CA [demo]", ... }
```

**Prerequisites**: Docker, Node.js 22+, Yarn

## Data Schema: Local Address Base (LAB)

The heart of this project is the **LAB format** — a minimal CSV schema with just **12 required fields** (modeled on France's BAL v1.4). See [LAB_SPEC_v1.0.md](LAB_SPEC_v1.0.md) for the full specification.

The key insight: **ask for only what the local authority actually knows, derive everything else**. The submitter provides 12 fields; the platform automatically generates full NAD/NENA/FGDC-compliant exports.

### Core Fields
```
interop_key | jurisdiction_fips | jurisdiction_name | street_name | number
suffix | position_type | x | y | longitude | latitude
source | date_updated | certified
```

## Overture Maps / GERS Integration

This platform is designed for **bidirectional data quality exchange** with the [Overture Maps Foundation](https://overturemaps.org/) via [GERS (Global Entity Reference System)](https://docs.overturemaps.org/gers) IDs.

**What are GERS IDs?** Stable UUID v4 identifiers assigned to 446M+ real-world geographic entities (addresses, roads, buildings, places) in the Overture dataset. They persist across monthly releases and enable any dataset to become "GERS-enabled" — ready to cross-reference with the entire Overture ecosystem.

**How NAP uses GERS:**

| Direction | Flow | Mechanism |
|-----------|------|-----------|
| Overture → NAP | Import baseline US address data | Match by proximity + name, assign GERS IDs to NAP addresses |
| NAP → Overture | Contribute certified local data back | Export with GERS IDs for Overture conflation |
| Quality loop | Flag corrections both ways | GERS IDs provide stable reference across systems |

**API Endpoints** (under `/v2/overture/`):
- `GET /gers/:gersId` — Reverse lookup: find a NAP address by its Overture GERS ID
- `POST /link/numero/:id` — Link a GERS ID to an address point
- `GET /stats/:balId` — GERS coverage statistics for a Local Address Base
- `GET /export/:balId?countyFips=` — Export addresses in Overture-compatible format

Every address, street, and place name in the platform can carry a GERS ID, stored as a nullable UUID column alongside our internal identifiers.

## Data Sources

| Source | Records | Role |
|--------|---------|------|
| [Overture Maps Foundation](https://docs.overturemaps.org/guides/addresses/) | 121.5M US addresses | Baseline national dataset (GERS-linked) |
| [NAD (US DOT)](https://www.transportation.gov/gis/national-address-database) | Varies by state | Federal compilation |
| [Census TIGER/Line](https://www.census.gov/) | Address ranges | Supplementary coverage |
| Local authorities | Authoritative | Primary source via My Addresses editor |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, TypeScript, React, MapLibre GL JS |
| Backend API | NestJS, TypeScript, TypeORM |
| Engine | Express.js, Node.js |
| Database | PostgreSQL + PostGIS |
| Cache/Queue | Redis |
| Storage | S3-compatible |
| Geocoder | Addok (Python) via Docker |
| i18n | next-intl (English + Spanish) |

## Project Documents

- [PROJECT_RESEARCH_AND_PLAN.md](PROJECT_RESEARCH_AND_PLAN.md) — Full research, architecture, and implementation roadmap
- [LAB_SPEC_v1.0.md](LAB_SPEC_v1.0.md) — Local Address Base format specification (US equivalent of France's BAL)

## Roadmap

| Phase | Timeline | Goal |
|-------|----------|------|
| **Phase 1: 1:1 Port** | Months 1-4 | French system running with US data |
| **Phase 2: US Adaptation** | Months 5-8 | Spanish language, US jurisdictions, Overture import, pilot |
| **Phase 3: Schema Expansion** | Months 9-14 | Auto-generate NAD/NENA/FGDC exports from minimal input |
| **Phase 4: National Launch** | Months 15-20 | Full national rollout |

## Stakeholders

- **National Address Database (NAD)** — US DOT
- **US Census Bureau** — MAF/TIGER integration
- **NENA / NG911** — Emergency services addressing
- **Overture Maps Foundation** — Baseline data + partnership
- **State GIS Programs** — Statewide address coordination
- **Local Jurisdictions** — Counties, cities, townships, tribal authorities

## Credits

This project is built on the incredible open-source work of the French [Base Adresse Nationale](https://github.com/BaseAdresseNationale/) team, including [Etalab/DINUM](https://www.etalab.gouv.fr/), [ANCT](https://agence-cohesion-territoires.gouv.fr/), and the [AITF SIG Topo](https://aitf-sig-topo.github.io/voies-adresses/) working group. The BAL v1.4 specification and BAN platform are open-source under MIT license.

Address baseline data provided by the [Overture Maps Foundation](https://overturemaps.org/).

## License

MIT (matching upstream BAN license)
