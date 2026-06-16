# NG911 Site/Structure Address Point — Mapping & Gap Analysis

How the NAP minimal core maps to the **NENA-STA-006.3-2026** Site/Structure
Address Point (SSAP) layer, what we can derive automatically, what must come from
the local 911 authority, and what new layers NG911 adds beyond address points.

Guiding principle (unchanged): keep the editor's submission core minimal — the
BAL philosophy — and treat NENA as an **ETL/export target**, which is exactly how
NENA frames the model ("GIS Data Providers will utilize ETL processes to migrate
their organization-unique data into the NENA NG9-1-1 GIS Data Model"). We do not
make clerks type 60+ fields.

## Three buckets

Every SSAP field is one of:

- **Derived** — produced automatically from the core (street-name parser, FIPS
  reference, geocode, or the address-range / placement tools). No user effort.
- **Authority** — cannot be inferred from address data; supplied by the 911
  authority/PSAP. Collected through the existing certify/submit flow, stored in
  an NG911 extension table.
- **Reference** — looked up from FIPS / Census / NENA Registry / postal data.

## SSAP field mapping

| NENA SSAP field | Bucket | Source in NAP |
|---|---|---|
| `Site_NGUID` | Derived | Minted from `banId` + agency domain (see NGUID below) |
| `DiscrpAgID` | Authority | 911 authority's NENA agency ID |
| `DateUpdate` | Derived | `date_updated` |
| `Country` | Reference | `US` |
| `State` (A1) | Reference | From `jurisdiction_fips` (state) |
| `County` (A2) | Reference | From `jurisdiction_fips` (county) |
| `Inc_Muni` (A3) | Reference/Authority | Place FIPS / geocode; authority override |
| `Uninc_Comm` (A4) | Authority | Unincorporated community name |
| `Nbrhd_Comm` (A5) | Authority | Optional neighborhood |
| `AddNum_Pre` | Core/Authority | Address number prefix (rare; new core field) |
| `Add_Number` | Core | `numero` |
| `AddNum_Suf` | Core | `suffixe` |
| `St_PreMod` | Derived | Street-name parser (CLDXF-US / STA-004) |
| `St_PreDir` | Derived | Parser |
| `St_PreTyp` | Derived | Parser |
| `St_PreSep` | Derived | Parser |
| `St_Name` | Derived/Core | Parser body from `street_name` |
| `St_PosTyp` | Derived | Parser |
| `St_PosDir` | Derived | Parser |
| `St_PosMod` | Derived | Parser |
| `LSt_*` (legacy name parts) | Derived | Parser (legacy variant) |
| `ESN` | **Authority** | Emergency Service Number — PSAP only |
| `MSAGComm` | **Authority** | MSAG community name — PSAP only |
| `Post_Comm` | Reference/Authority | Postal community (USPS) |
| `Post_Code` | Reference | `postcode` / geocode |
| `Post_Code4` | Authority | ZIP+4 (optional) |
| `Building` | Authority | Structured building identifier |
| `Floor` | Authority | Floor |
| `Unit` | Core/Authority | From `unit` / `position_type=unit` |
| `Room` / `Seat` | Authority | Optional sub-unit |
| `Addtl_Loc` | Authority | Additional location text |
| `LandmkName` | Authority | `place_name` / landmark |
| `Mile_Post` | Authority | Optional |
| `Place_Type` | Derived/Authority | IANA location type (default from context) |
| `Placement` | Derived | **From `position_type`** → NENA Placement domain |
| `Long` / `Lat` | Core | `longitude` / `latitude` |
| `Elev` | Authority | Optional 3D (NENA-REQ-003) |

Note the `position_type → Placement` alignment: `LAB_SPEC` already added
`structure` and `rooftop` precisely because they map to NENA placement methods.

### The genuinely NG911-only fields

Three things no map dataset (Overture, OpenAddresses, county GIS) can give you,
because they encode emergency-dispatch policy, not geography:

- **`ESN`** and **`MSAGComm`** — owned by the PSAP/911 authority.
- **`DiscrpAgID`** + a discrepancy-reporting workflow — NENA expects a feedback
  loop when data disagrees. This maps cleanly onto our GERS quality loop and the
  api-depot submission pipeline.

These are the fields worth designing the authority intake around. Everything else
is derivation or reference.

## NENA GUID format

A `Site_NGUID` is a URI-style global id: `<unique-string>@<agency-domain>`, e.g.
`a1b2c3d4-...@addresses.tularecounty.gov`. We already mint a UUID `banId` per
address; the NGUID is `banId@<jurisdiction-domain>`, with the domain configured
per authority. Stable across releases, like GERS.

## Extension table (authority + parser cache)

Keep the core `numeros` table minimal; add a sibling table for NG911 attributes.
Sparse and nullable — only populated as authorities provide data.

```sql
CREATE TABLE numeros_ng911 (
  numero_id     VARCHAR(24) PRIMARY KEY
                REFERENCES numeros(id) ON DELETE CASCADE,
  -- authority-supplied
  esn           VARCHAR(5),
  msag_comm     VARCHAR(60),
  discrp_ag_id  VARCHAR(75),
  add_code      VARCHAR(6),
  inc_muni      VARCHAR(100),
  uninc_comm    VARCHAR(100),
  nbrhd_comm    VARCHAR(100),
  post_comm     VARCHAR(40),
  post_code4    VARCHAR(4),
  building      VARCHAR(75),
  floor         VARCHAR(75),
  unit          VARCHAR(75),
  room          VARCHAR(75),
  seat          VARCHAR(75),
  addtl_loc     VARCHAR(225),
  landmk_name   VARCHAR(150),
  place_type    VARCHAR(50),
  elev          INTEGER,
  -- minted / derived cache (recomputed on edit)
  site_nguid    VARCHAR(254),
  addnum_pre    VARCHAR(15),
  st_predir     VARCHAR(9),
  st_pretyp     VARCHAR(50),
  st_name       VARCHAR(60),
  st_postyp     VARCHAR(50),
  st_posdir     VARCHAR(9),
  placement     VARCHAR(25),
  parsed_at     TIMESTAMP,
  authority_updated TIMESTAMP
);
```

## NG911 is more than points: two new layers

SSAP is one of three mandatory NG911 layers. Budget for the other two:

- **Road Centerlines** with left/right `From/To` address ranges + parity. We can
  **derive** these from address points today — see
  `scripts/derive_address_ranges.py` (validated: ~84% of points auto-assigned in
  a Tulare County sample, opposite parity per side, low-confidence rows flagged).
- **PSAP / Emergency Service Boundaries** — authority-supplied polygons. New
  layer; no derivation possible.

## Export endpoint (sibling to the Overture export) — IMPLEMENTED

```
GET /v2/ng911/export/:balId?layer=ssap|centerline      → CSV
```

Built (`apps/api/src/modules/ng911/`, `libs/shared/src/modules/ng911/`):

- `layer=ssap` — assembles core + parsed street components (CLDXF parser) +
  `numeros_ng911` extension + minted NGUID + `position.type → Placement`, emits
  the SSAP column set as CSV.
- `layer=centerline` — derives Road Centerline address ranges. **True left/right**
  when the street has centerline geometry (`voie.trace`), computed with the same
  side-of-line method validated in `derive_address_ranges.py`; falls back to
  odd/even parity ranges when no trace exists.

Still to add: GeoPackage output (relational template, STA-006.3), NENA Registry
domain validation, and a `GET /v2/ng911/compliance/:balId` readiness score.

## Build order

1. ~~Street-name parser (CLDXF-US) → fills all `St_*` derived fields.~~ **Done**
   (`libs/shared/src/utils/street_parser.util.ts`).
2. ~~`numeros_ng911` table~~ **Done** (entity + migration `1770300000000`);
   authority intake UI on the certify flow still to do. *(M)*
3. ~~Centerline range derivation wired to an export.~~ **Done** (`layer=centerline`).
4. GeoPackage export + NENA domain validation (CSV done; GeoPackage pending). *(M)*
5. Compliance/readiness scoring. *(S)*
6. Service-boundary layer + discrepancy workflow. *(L)*

Nothing here changes the core editor or the LAB submission format — it's all
additive, exactly as the Phase-3 plan intended.
