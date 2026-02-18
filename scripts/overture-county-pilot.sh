#!/usr/bin/env bash
set -euo pipefail

# One-county Overture extraction pilot.
# Produces:
#  1) raw Overture slice CSV
#  2) LAB-aligned draft CSV for review/import
#
# Required:
#  - duckdb CLI in PATH
#
# Optional env vars:
#  - OVERTURE_RELEASE (default: 2026-01-21.0)
#  - MIN_LON / MAX_LON / MIN_LAT / MAX_LAT (county bbox)
#  - COUNTY_CODES_URL (default: Census national_county.txt)
#  - RAW_OUT (default: ./tmp/overture-county-raw.csv)
#  - LAB_OUT (default: ./tmp/overture-county-lab-draft.csv)

if ! command -v duckdb >/dev/null 2>&1; then
  echo "duckdb CLI is required. Install with: brew install duckdb" >&2
  exit 1
fi

OVERTURE_RELEASE="${OVERTURE_RELEASE:-2026-01-21.0}"
MIN_LON="${MIN_LON:--95.35}"
MAX_LON="${MAX_LON:--95.15}"
MIN_LAT="${MIN_LAT:-38.90}"
MAX_LAT="${MAX_LAT:-39.00}"
COUNTY_CODES_URL="${COUNTY_CODES_URL:-https://www2.census.gov/geo/docs/reference/codes/files/national_county.txt}"
RAW_OUT="${RAW_OUT:-./tmp/overture-county-raw.csv}"
LAB_OUT="${LAB_OUT:-./tmp/overture-county-lab-draft.csv}"

mkdir -p "$(dirname "$RAW_OUT")" "$(dirname "$LAB_OUT")"

duckdb -cmd "
INSTALL httpfs;
INSTALL spatial;
LOAD httpfs;
LOAD spatial;
SET s3_region='us-west-2';

CREATE OR REPLACE TEMP TABLE county_codes AS
SELECT
  upper(col0) AS state_abbrev,
  lpad(col1, 2, '0') AS state_fips,
  lpad(col2, 3, '0') AS county_fips,
  trim(col3) AS county_name_raw,
  lower(
    trim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(trim(col3), '(?i)\\s+county$', ''),
              '(?i)\\s+parish$',
              ''
            ),
            '(?i)\\s+census area$',
            ''
          ),
          '(?i)\\s+borough$',
          ''
        ),
        '(?i)\\s+municipio$',
        ''
      )
    )
  ) AS county_norm
FROM read_csv(
  '${COUNTY_CODES_URL}',
  delim = ',',
  columns = {
    'col0': 'VARCHAR',
    'col1': 'VARCHAR',
    'col2': 'VARCHAR',
    'col3': 'VARCHAR',
    'col4': 'VARCHAR'
  },
  header = false
);

CREATE OR REPLACE TEMP TABLE overture_slice AS
SELECT
  id AS overture_id,
  number AS number,
  street AS street_name,
  unit AS unit,
  postcode AS postcode,
  COALESCE(address_levels[0].value, '') AS state,
  COALESCE(address_levels[1].value, '') AS county,
  COALESCE(address_levels[2].value, '') AS municipality,
  ST_X(geometry) AS longitude,
  ST_Y(geometry) AS latitude
FROM read_parquet(
  's3://overturemaps-us-west-2/release/${OVERTURE_RELEASE}/theme=addresses/type=address/*',
  filename = true,
  hive_partitioning = 1
)
WHERE country = 'US'
  AND bbox.xmin > ${MIN_LON}
  AND bbox.xmax < ${MAX_LON}
  AND bbox.ymin > ${MIN_LAT}
  AND bbox.ymax < ${MAX_LAT};

CREATE OR REPLACE TEMP TABLE overture_with_fips AS
SELECT
  s.*,
  c.state_fips,
  c.county_fips,
  CASE
    WHEN c.state_fips IS NOT NULL AND c.county_fips IS NOT NULL
      THEN c.state_fips || c.county_fips
    ELSE ''
  END AS jurisdiction_fips
FROM (
  SELECT
    *,
    lower(
      trim(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(trim(county), '(?i)\\s+county$', ''),
                '(?i)\\s+parish$',
                ''
              ),
              '(?i)\\s+census area$',
              ''
            ),
            '(?i)\\s+borough$',
            ''
          ),
          '(?i)\\s+municipio$',
          ''
        )
      )
    ) AS county_norm
  FROM overture_slice
) AS s
LEFT JOIN county_codes AS c
  ON c.state_abbrev = upper(s.state)
 AND c.county_norm = s.county_norm;

COPY (
  SELECT *
  FROM overture_with_fips
) TO '${RAW_OUT}' (HEADER, DELIMITER ',');

COPY (
  SELECT
    overture_id AS id_nap_address,
    municipality AS jurisdiction_name,
    jurisdiction_fips,
    street_name,
    number,
    unit AS suffix,
    longitude,
    latitude,
    'unknown' AS position_type,
    postcode AS zip_code,
    'overture' AS source
  FROM overture_with_fips
) TO '${LAB_OUT}' (HEADER, DELIMITER ',');

SELECT
  count(*) AS total_rows,
  sum(CASE WHEN jurisdiction_fips = '' THEN 1 ELSE 0 END) AS missing_jurisdiction_fips
FROM overture_with_fips;
"

echo "Pilot extraction complete."
echo "  Raw slice:  ${RAW_OUT}"
echo "  LAB draft:  ${LAB_OUT}"
echo "Next: fill jurisdiction_fips and run validation in api-depot publish flow."
