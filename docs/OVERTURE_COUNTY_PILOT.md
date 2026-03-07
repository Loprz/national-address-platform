# Overture County Pilot

This pilot is a low-risk first step for modern geospatial ingestion:

- Pull one county-sized Overture slice with DuckDB over S3 GeoParquet.
- Enrich `jurisdiction_fips` using Census county FIPS reference codes.
- Emit a raw dataset for QA.
- Emit a LAB-aligned draft CSV for ingestion testing.

## Why this first

- Keeps the editor UX unchanged for end users.
- Gives us a baseline address layer quickly.
- Lets us validate quality and enrichment before scaling nationally.

## National sizing reality

Do not treat Overture as a single app file for the editor.

- Public Overture release `2026-02-18.0` lists the global `theme=addresses/type=address` dataset at about `20.0 GB` compressed parquet across 19 files.
- Using the current US planning figure of about `121.5M` US addresses out of `446M+` global addresses, the US-only slice is roughly `5.4 GB` compressed parquet.
- JSON, CSV, or fully indexed database storage will be materially larger than the parquet source files.

For this project, the operational default is:

- keep Overture in parquet/object storage or staging
- partition imports by state, county, or pilot boundary
- import only the jurisdiction currently being tested into `mes-adresses-api`

Do not attempt a full-US import into the primary editor database during the current pilot phase.

## Prerequisites

- DuckDB CLI installed (`brew install duckdb`)
- Internet access to `s3://overturemaps-us-west-2`

## Run

From repo root:

```bash
./scripts/overture-county-pilot.sh
```

With a custom county bounding box:

```bash
MIN_LON=-97.95 MAX_LON=-97.35 MIN_LAT=30.05 MAX_LAT=30.65 \
OVERTURE_RELEASE=2026-01-21.0 \
./scripts/overture-county-pilot.sh
```

With a custom county code reference URL:

```bash
COUNTY_CODES_URL=https://www2.census.gov/geo/docs/reference/codes/files/national_county.txt \
./scripts/overture-county-pilot.sh
```

## Outputs

- Raw slice: `./tmp/overture-county-raw.csv`
- LAB draft: `./tmp/overture-county-lab-draft.csv`

Draft columns:

- `id_nap_address`
- `jurisdiction_name`
- `jurisdiction_fips` (auto-filled from Census county/state FIPS when matched)
- `street_name`
- `number`
- `suffix`
- `longitude`
- `latitude`
- `position_type` (currently `unknown`)
- `zip_code`
- `source` (`overture`)

## Immediate next checks

1. Review rows where `jurisdiction_fips` is blank (printed by script summary).
2. Run the CSV through existing validation/publish flow.
3. Compare import quality against local authoritative sample points.
4. Track corrections so local edits can override imported geometry.
