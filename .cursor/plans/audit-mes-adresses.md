# Audit Report: National Address Platform (NAP) Port

## Summary — Frontend + Backend + GERS Integration
- **Frontend (mes-adresses)**: Fully ported — 600+ French strings translated, map config swapped, legal pages rewritten, data model terms updated, i18n configured (en/es)
- **Backend API (mes-adresses-api)**: Core porting complete — FIPS code system replaces French COG, 33+ French strings translated, S3/BAN services made resilient for local dev
- **Overture Maps / GERS**: Full integration — GERS IDs on all entities, bidirectional API, spatial matching, CSV export with GERS column
- **Local Dev Environment**: Docker Compose with PostgreSQL+PostGIS and Redis, API running on port 5050, 13 DB migrations applied
- **End-to-End Tested**: Demo LAB creation, address CRUD with GERS IDs, reverse lookup, export — all working

## Overture Maps / GERS Integration (NEW)

### What is GERS?
The Global Entity Reference System (GERS) is Overture Maps Foundation's universal framework for identifying geospatial entities. GERS IDs are UUID v4 identifiers that remain stable across monthly Overture releases, covering 446M+ address points from 175+ sources.

### Implementation

| Component | Details |
|-----------|---------|
| DB Migration | `1760000000000-add_gers_id.ts` — adds `gers_id` (UUID, indexed) to numeros, voies, toponymes; `overture_source` (JSONB) to numeros |
| Entity fields | `gersId` (UUID, nullable) on Numero, Voie, Toponyme; `overtureSource` (JSONB) on Numero |
| DTOs | `gersId` accepted on create/update for all three entity types; validated as UUID v4 |
| Service layer | `OvertureService` — spatial matching, GERS linking, export, stats |
| API Controller | 6 endpoints under `/v2/overture/` |
| CSV Export | `id_gers` column added to LAB CSV export |
| Type definitions | `overture.types.ts` — OvertureAddress, GersRegistryEntry, match/export types |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v2/overture/gers/:gersId` | Reverse lookup: find NAP address by GERS ID |
| `POST` | `/v2/overture/link/numero/:id` | Link a GERS ID to an address point |
| `POST` | `/v2/overture/link/voie/:id` | Link a GERS ID to a street |
| `POST` | `/v2/overture/link/toponyme/:id` | Link a GERS ID to a place name |
| `GET` | `/v2/overture/stats/:balId` | GERS coverage statistics for a LAB |
| `GET` | `/v2/overture/export/:balId?countyFips=` | Export addresses in Overture-compatible format |

### Bidirectional Data Flow
1. **Overture → NAP**: Import Overture address data, match by proximity + name similarity, assign GERS IDs
2. **NAP → Overture**: Export certified addresses with GERS IDs for contribution back to Overture
3. **Quality Feedback**: When a local authority corrects an address with a GERS ID, the correction can propagate

### Data Model

| Entity | GERS Field | DB Column | Purpose |
|--------|-----------|-----------|---------|
| Numero (address) | `gersId` | `gers_id` uuid | Links to Overture `addresses/address` |
| Numero (address) | `overtureSource` | `overture_source` jsonb | Provenance (version, confidence, import date) |
| Voie (street) | `gersId` | `gers_id` uuid | Links to Overture `transportation/segment` |
| Toponyme (place) | `gersId` | `gers_id` uuid | Links to Overture `places/place` |

## Backend Port Status (mes-adresses-api)

### Completed
| Task | Description |
|------|-------------|
| FIPS code system | Created `fips.utils.ts` with 57 states + 3,235 counties from US Census Bureau data |
| COG validator updated | `ValidatorCogCommune` now validates 5-digit FIPS county codes instead of French INSEE codes |
| Entity updated | `BaseLocale.getCommuneNom()` uses FIPS jurisdiction names (e.g., "Los Angeles County, CA") |
| Commune service | Returns US jurisdiction data (map capability flags, no overseas territory logic) |
| Search query pipe | Uses `isValidFips()` for commune field validation |
| CSV export | Uses FIPS jurisdiction names + GERS IDs in export |
| BAN platform service | Falls back to local UUID generation when BAN platform is unavailable |
| S3 service | Gracefully handles missing S3 configuration (warns instead of crashing) |
| French error messages | 33+ strings translated to English across 13 files |
| API description | Updated to English in `main.ts` |
| **GERS integration** | Full Overture Maps GERS ID support across all entities and API |

### Infrastructure Setup
| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL 16 + PostGIS | Running | Docker container `nap-postgres` on port 5432 |
| Redis 7 | Running | Docker container `nap-redis` on port 6379 |
| Database schema | Applied | 13 TypeORM migrations (including GERS) |
| API server | Running | NestJS on port 5050 with hot-reload |
| Docker Compose | Created | `/docker-compose.yml` for all local services |

### API Endpoint Verification
- `POST /v2/bases-locales/create-demo` — Creates demo LAB for US counties (tested: FIPS 06037 = Los Angeles County, CA)
- `GET /v2/commune/:fipsCode` — Returns jurisdiction info (tested: 06037, 36061)
- `GET /v2/stats/bals/status` — Returns status distribution
- `POST /v2/voies/:id/numeros` with `gersId` — Creates address with GERS ID (tested: UUID persists and returns)
- `GET /v2/overture/gers/:gersId` — Reverse lookup by GERS ID (tested: returns full address)
- `GET /v2/overture/stats/:balId` — GERS coverage statistics (tested: 50% coverage)
- `GET /v2/overture/export/:balId` — Overture-compatible export (tested: includes GERS IDs)

### Data Model Mapping (Backend)

| French Field | US Field | DB Column | Notes |
|-------------|----------|-----------|-------|
| commune (INSEE 5-char) | jurisdiction (FIPS 5-digit) | `commune` varchar(5) | Column name kept for compatibility |
| commune_deleguee | sub-jurisdiction | `commune_deleguee` varchar(5) | Rarely used in US model |
| COG data | FIPS data | `us-fips-data.json` (265 KB) | 57 states + 3,235 counties |
| banId (UUID from BAN) | banId (local UUID) | `ban_id` uuid | Generated locally when BAN unavailable |
| — (new) | gersId (Overture GERS) | `gers_id` uuid | Links to Overture Maps entities |
| — (new) | overtureSource | `overture_source` jsonb | Provenance metadata for Overture data |

## Frontend Port Status (mes-adresses)

### Completion Status
| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | i18n setup + core layout translation | Complete |
| Phase 2 | Help docs, settings, auth, wizard | Complete |
| Phase 3 | Map config, URLs, legal pages | Complete |
| Phase 4 | Data model term swap + final cleanup | Complete |
| Phase 5 | Spanish translation verification | Complete |

### Environment Configuration
- `NEXT_PUBLIC_BAL_API_URL=http://localhost:5050/v2` (points to local API)
- `NEXT_PUBLIC_MAP_TILES_URL=https://tiles.stadiamaps.com/styles/osm_bright.json`
- `NEXT_PUBLIC_MAP_GLYPHS_URL=https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf`

## Remaining Infrastructure Work
1. **Connect frontend to backend** — verify full CRUD flow (create LAB, add streets, add numbers)
2. **Overture Maps bulk import** — build GeoParquet reader to bulk-import county address data with GERS IDs
3. **US Census TIGER boundary tiles** — enable county/state layers on the map
4. **Authentication system** — adapt authorization flow for US jurisdiction verification
5. **Parcel data source** — integrate US county parcel tile data
6. **PDF templates** — translate French legal document templates to US equivalents
7. **Email templates** — translate Handlebars email templates to English
