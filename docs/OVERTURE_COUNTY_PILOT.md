# Overture Loading — County Pilot to US Scale

This documents how Overture address data is loaded into the National Address
Platform (NAP), from the original one-county pilot to the US-scalable loader
used for the California county trial and, eventually, the whole country.

## TL;DR

> Run the Python loader from the `mes-adresses-api/` directory (it reads
> `us-fips-data.json` and talks to the API there). The shell pilot lives at
> repo-root `scripts/`.

```bash
cd mes-adresses-api

# Dry run: scan California once, report addresses per county for the latest release
python3 scripts/load_overture.py --state CA --dry-run

# Load every California county (chunked + append, skips already-imported counties)
python3 scripts/load_overture.py --state CA --skip-existing --email you@example.gov

# One county
python3 scripts/load_overture.py --fips 06037
```

`scripts/load_overture.py` is the go-forward loader. The older
`scripts/import-overture.py` and `scripts/overture-county-pilot.sh` are retained
for single-jurisdiction and Overture locality-boundary work.

## Design principles (built for US scale)

The loader was designed so the same code path runs for one county, one state, or
the whole country. Four decisions make that possible.

### 1. Release is resolved, never pinned

The latest Overture release is read from the STAC catalog
(`https://stac.overturemaps.org/`, top-level `latest` field) at runtime.
`scripts/overture_release.py` is the single source of truth.

- Default: track the newest monthly release automatically.
- `--release 2026-05-20.0` or `OVERTURE_RELEASE=2026-05-20.0`: pin for
  reproducibility.
- `OVERTURE_RELEASE=latest`: explicit auto-track.
- If the catalog is unreachable, a pinned fallback constant is used.

```bash
python3 scripts/overture_release.py          # -> 2026-05-20.0
python3 scripts/overture_release.py --list    # all releases, newest first
```

The resolved release is stamped onto every imported address
(`numero.overtureSource.release`) and onto the LAB (`overture_import.release`).

### 2. One scan per state, not per county

Overture's address parquet is filtered to a single **state** bounding box per
scan (`scripts/state_bboxes.py`, ~50 entries). The bbox is only a coarse
pre-filter — it does **not** decide the county. This is why we need ~50 state
bboxes instead of a hand-maintained table of 3,000+ county bboxes.

### 3. County assignment is by ATTRIBUTE matching

`scripts/overture_fips.py` assigns each address to a 5-digit county FIPS using
attributes already present on the record, driven entirely by
`us-fips-data.json` (so it works for any US county with no per-county config):

| Tier | Signal | Notes |
|------|--------|-------|
| 1 | `sources[].dataset`, e.g. `OpenAddresses/CA/Tulare County` | Authoritative when present. ~100% of California. |
| 2 | `address_levels[1]` (city) → Census place → `countyFips` | Fallback. US `address_levels` is `[state, city]` and has **no county level**. |
| 3 | `postcode` (ZIP) → county crosswalk | Optional; only active when a crosswalk file is supplied (`ZIP_COUNTY_CROSSWALK`). For NAD-sourced data. |

Rows whose matched county falls outside the state being scanned (bbox
spillover) are dropped. Unmatched rows are counted and reported, never guessed.

**Known national-rollout gap.** OpenAddresses-sourced states (e.g. California)
carry the county explicitly in the source string → Tier 1 matches ~100% with no
extra data. **NAD-sourced data** (National Address Database; observed across
much of Texas) arrives with `dataset = "NAD"` and a **null city**, so Tiers 1
and 2 both miss. Those addresses need either:

- a ZIP→county crosswalk (Tier 3) — approximate at county boundaries because a
  ZIP can span counties; or
- a spatial point-in-county fallback (exact) — deferred; the attribute path was
  chosen for the trial.

This does **not** affect the California trial. Plan to add Tier 3 (or a spatial
fallback) before loading NAD-sourced states.

### 4. Import is chunked, append-capable, and idempotent

Large counties exceed the API's request-body limit and cannot be imported in a
single POST. The loader splits a county into chunks (`--chunk-size`, default
25,000) and the API supports appending:

- First chunk → creates the LAB, returns `balId` + `token`.
- Later chunks → `append=true` with `balId` + `token`; the service pre-loads the
  LAB's existing streets so chunks reuse `voie`s instead of duplicating them.
- The LAB records `overture_import = { release, importedAt, chunks, addressCount }`.
- `--skip-existing` calls `GET /v2/overture/lab?fips=&release=` and skips
  counties already imported for that release.

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/v2/overture/import` | Create or (with `append`/`balId`/`token`) extend a LAB. Accepts `release`. |
| `GET`  | `/v2/overture/lab?fips=&release=` | Idempotency lookup: existing import for a jurisdiction. |

Schema change: `bases_locales.overture_import` JSONB column +
`(commune, overture_import->>'release')` index
(migration `1770200000000-add_overture_import_to_bal.ts`).

## Prerequisites

- DuckDB (`pip3 install duckdb requests`) — used by the loader to read Overture
  GeoParquet directly from S3 (`s3://overturemaps-us-west-2`, anonymous).
- The `mes-adresses-api` running with PostgreSQL/PostGIS migrated
  (`yarn typeorm:migration:run`).
- Disk headroom: statewide California is ~13–14M addresses.

## California trial: recommended sequence

```bash
# 1. Size it (no writes): per-county counts + resolved release
python3 scripts/load_overture.py --state CA --dry-run

# 2. Load a couple of counties end-to-end first
python3 scripts/load_overture.py --state CA --counties 06019,06107 --email you@example.gov

# 3. Load the rest; safe to re-run (skips finished counties)
python3 scripts/load_overture.py --state CA --skip-existing --email you@example.gov
```

## Scaling to the whole US

The only change is the set of states to scan — loop the state FIPS in
`state_bboxes.py` (or call `--state` per state from a driver) and the same
attribute matching, chunking, append, and idempotency apply. Before including
NAD-sourced states, close the Tier-3 / spatial-fallback gap noted above.

## Files

| File | Role |
|------|------|
| `mes-adresses-api/scripts/load_overture.py` | Go-forward US-scalable loader (state scan → county split → chunked/append import). |
| `mes-adresses-api/scripts/overture_release.py` | Resolve the Overture release from the STAC catalog. |
| `mes-adresses-api/scripts/overture_fips.py` | Attribute-based county-FIPS matcher (source → city → ZIP). |
| `mes-adresses-api/scripts/state_bboxes.py` | State bounding boxes + abbreviation→FIPS. |
| `mes-adresses-api/scripts/import-overture.py` | Legacy single-jurisdiction / locality-boundary importer (now release-aware). |
| `scripts/overture-county-pilot.sh` (repo root) | Original DuckDB one-county CSV pilot. |
