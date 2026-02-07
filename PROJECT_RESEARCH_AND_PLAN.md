# US National Address Platform (USNAP)
## Porting France's Base Adresse Nationale (BAN) to the United States

---

## 1. Research: What is the Base Adresse Nationale (BAN)?

### Overview
The **Base Adresse Nationale (BAN)** is France's official national address database, launched on April 15, 2015. Its mission is to **reference every address in French territory** (~26 million addresses) and make them freely usable by all — citizens, businesses, municipalities, and government agencies.

The project was initiated by **Etalab** (France's open data mission) as part of France's national action plan for transparent and collaborative public action, aligned with the Open Government Partnership (OGP) principles.

### Key Partners
| Partner | Role |
|---------|------|
| **Etalab / DINUM** | Technical lead, platform development |
| **IGN** (National Geographic Institute) | Geographic/mapping data provider |
| **La Poste** (French Postal Service) | Address data provider, validation |
| **OpenStreetMap France** | Community address data contributor |
| **ANCT** (National Territorial Cohesion Agency) | Co-governance since 2020 |
| **Municipalities** (~36,000) | Local address authority, data editors |

### Problems BAN Solved
1. **300 million returned letters/parcels per year** — inaccurate addresses cost La Poste enormous revenue
2. **Fragmented government databases** — multiple incompatible, incomplete address databases across agencies
3. **No single authoritative source** — IGN, La Poste, DGFIP (tax authority) all had different address lists
4. **No geocoding service** — no free, open, French geocoder before BAN
5. **Municipality frustration** — no simple tools for local address management

### What BAN Has Accomplished
- **26+ million geocoded addresses** across all of France
- **27,033 municipalities** have actively updated their address data
- **Weekly data updates** published openly
- **Free geocoding API** comparable to commercial solutions (Google, HERE)
- **"Mes Adresses" editor** — a no-code web tool for municipalities to manage addresses
- **BAL (Base Adresse Locale) standard** — a universal CSV format for address data exchange
- **API de Dépôt** — a versioned submission/publishing system for local address data
- **Addok** — an open-source geocoder engine (deployable via Docker)
- **Interactive map explorer** of the entire national address database
- **Error reporting system** for citizen feedback
- **Training resources** — webinars, videos, documentation

---

## 2. BAN Software Architecture (What We're Porting)

The BAN ecosystem consists of **5 core software components**, all open-source (MIT license):

### Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    PUBLIC-FACING WEBSITE                         │
│            adresse.data.gouv.fr (Next.js / TypeScript)          │
│  ┌─────────────┬──────────────┬────────────┬─────────────────┐  │
│  │ Address     │ Interactive  │ Data       │ Blog /          │  │
│  │ Search      │ Map Explorer │ Downloads  │ Documentation   │  │
│  └─────────────┴──────────────┴────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────┐  ┌──────────────────────────────────┐
│   MES ADRESSES (UX)     │  │   BAN PLATEFORME                 │
│   Next.js / TypeScript   │  │   Express.js / Node.js           │
│                          │  │                                  │
│ • Address editor for     │  │ • Data integration platform      │
│   local authorities      │  │ • Consolidation engine           │
│ • BAL management         │  │ • Export production              │
│ • Map-based interface    │  │ • API (sync + async)             │
│ • Embedded tutorials     │  │ • Worker queue (Redis)           │
│ • No technical skills    │  │ • MongoDB + PostGIS              │
│   needed                 │  │                                  │
└──────────┬──────────────┘  └──────────────┬───────────────────┘
           │                                 │
           ▼                                 ▼
┌─────────────────────────┐  ┌──────────────────────────────────┐
│  MES ADRESSES API       │  │   ADDOK (Geocoder)               │
│  NestJS / TypeScript     │  │   Python (Docker-ready)          │
│                          │  │                                  │
│ • BAL CRUD operations    │  │ • Full-text address search       │
│ • User auth / habilit.   │  │ • Reverse geocoding              │
│ • PostgreSQL + PostGIS   │  │ • Batch geocoding                │
│ • S3 file storage        │  │ • CSV processing                 │
│ • SMTP notifications     │  │ • Deployable on any server       │
│ • CRON for publishing    │  │                                  │
└──────────┬──────────────┘  └──────────────────────────────────┘
           │
           ▼
┌─────────────────────────┐
│   API DE DÉPÔT          │
│   NestJS / TypeScript    │
│                          │
│ • BAL versioning system  │
│ • Publication pipeline   │
│ • Authorization (Pro     │
│   Connect / France       │
│   Connect)               │
│ • Validation engine      │
│ • PostgreSQL             │
│ • S3 storage             │
│ • Webhook notifications  │
└─────────────────────────┘
```

### Technology Stack Summary
| Component | Framework | Language | Database | Key Dependencies |
|-----------|-----------|----------|----------|-----------------|
| Public Website | Next.js | TypeScript | — | MapLibre GL JS, React |
| Mes Adresses (Editor UX) | Next.js | TypeScript | — | MapLibre GL JS, React |
| Mes Adresses API | NestJS | TypeScript | PostgreSQL + PostGIS | TypeORM, Redis, S3 |
| API de Dépôt | NestJS | TypeScript | PostgreSQL | TypeORM, S3, SMTP |
| BAN Plateforme | Express.js | JavaScript | MongoDB + PostGIS | Redis, Sequelize |
| Addok (Geocoder) | Custom | Python | Redis | Docker |

---

## 3. US Context: Current Address Landscape

### Existing US Addressing Programs

| Program | Organization | Status | Scope |
|---------|-------------|--------|-------|
| **NAD** (National Address Database) | US DOT | Active (last updated Jan 2026) | National compilation of state/local data |
| **MAF/TIGER** | US Census Bureau | Active | Census geographic infrastructure |
| **NG911** | NENA / FCC | Rolling state deployment | Emergency call routing |
| **FGDC Address Standard** (STD-016-2011) | FGDC / Census Bureau | Published 2011 | Data standard for addresses |
| **Statewide Address Programs** | Individual States | Varies widely | State-level authoritative data |
| **LUCA** (Local Update of Census Addresses) | Census Bureau | Periodic | Decennial census preparation |

### Key Problems in the US (Mirroring France's Pre-BAN Issues)
1. **No unified national platform** — NAD is a data compilation, not an interactive tool
2. **Fragmented data** — each state, county, and municipality maintains separate address databases in different formats
3. **No free national geocoder** — US depends on commercial services (Google, ESRI, etc.)
4. **No simple editor for local authorities** — small jurisdictions lack GIS expertise
5. **NG911 gaps** — many areas still don't have accurate address points for emergency dispatch
6. **Census data quality** — MAF is not publicly accessible; address data accuracy varies
7. **No standard submission pipeline** — no easy way for local authorities to contribute to NAD
8. **Language barriers** — significant Spanish-speaking population needs bilingual access
9. **Scale** — ~150 million address points across 50 states + territories (6x France)

### US Data Standards We Must Support
1. **NAD Schema (April 2023)** — USDOT's national address point schema
2. **NENA NG9-1-1 Standard** — for emergency services
3. **FGDC-STD-016-2011** — Federal address data content standard
4. **USPS Publication 28** — Postal addressing standards
5. **Census MAF/TIGER** — Census Bureau geographic data model

---

## 4. Design Philosophy: Minimal Schema First

### Why France Succeeded (And Why US Programs Struggle)

The single most important design decision in the BAN project was the **BAL format** — a deliberately minimal, flat CSV schema that any municipality could produce, regardless of technical capacity. The BAL v1.1 (2016) launched with just **13 almost-entirely-obligatory fields**. Even the current v1.4 (2023) only has ~20 fields, and most are simple strings.

Compare this to the US landscape:
- **NAD Schema**: 40+ fields with cryptic abbreviations (`AddNum_Pre`, `St_PreMod`, `St_PosDir`, `Urbnztn_PR`)
- **NENA NG911**: Complex multi-table relational model with ECRF/LVF layers
- **FGDC-STD-016-2011**: 200+ page specification document

**This complexity is the #1 barrier to participation.** A county clerk in rural Kansas or a tribal office in New Mexico won't submit data if the form has 40+ fields with strict validation rules. France understood this — you get people in the door with something simple, and you enrich the data over time.

### Our Approach: BAL-Equivalent First, NENA/NAD Expansion Later

```
Phase 1 (1:1 Port)          Phase 2 (US Adapt)         Phase 3 (Schema Expansion)
┌──────────────────┐    ┌──────────────────────┐    ┌────────────────────────┐
│ BAL-equivalent   │    │ US-specific fields    │    │ Full NENA/NAD mapping  │
│ ~15 core fields  │───▶│ FIPS, ZIP, state      │───▶│ 40+ fields             │
│ Simple CSV       │    │ Still minimal entry   │    │ Auto-derived where     │
│ Works out of box │    │ Bilingual EN/ES       │    │ possible               │
└──────────────────┘    └──────────────────────┘    └────────────────────────┘
```

---

## 5. Data Model: Minimal Schema (BAL → LAB 1:1 Mapping)

### The French BAL v1.4 Schema (What We're Porting)

The BAL has just **20 fields**. Here's the exact 1:1 mapping to our US **Local Address Base (LAB)** format:

| # | BAL Field (French) | Required | LAB Field (US Equivalent) | Required | Notes |
|---|-------------------|----------|--------------------------|----------|-------|
| 1 | `id_ban_commune` | | `id_nap_jurisdiction` | | UUID v4 — jurisdiction ID from national platform |
| 2 | `id_ban_toponyme` | | `id_nap_street` | | UUID v4 — street/road ID from national platform |
| 3 | `id_ban_adresse` | | `id_nap_address` | | UUID v4 — address ID from national platform |
| 4 | `cle_interop` | **Yes** | `interop_key` | **Yes** | National interoperability key (FIPS + street code + number) |
| 5 | `commune_insee` | **Yes** | `jurisdiction_fips` | **Yes** | 5-digit FIPS code (state 2 + county 3) or 7-digit (+ place) |
| 6 | `commune_nom` | **Yes** | `jurisdiction_name` | **Yes** | Jurisdiction name (city, county, township, etc.) |
| 7 | `commune_deleguee_insee` | | `sub_jurisdiction_fips` | | For consolidated cities, annexed areas, etc. |
| 8 | `commune_deleguee_nom` | | `sub_jurisdiction_name` | | Sub-jurisdiction name |
| 9 | `voie_nom` | **Yes** | `street_name` | **Yes** | Full street name ("123 N Main St" → "North Main Street") |
| 10 | `lieudit_complement_nom` | | `place_name` | | Locality/neighborhood/landmark name |
| 11 | `numero` | **Yes** | `number` | **Yes** | Address number (99999 = street with no addresses) |
| 12 | `suffixe` | | `suffix` | | Unit/apt/suite, or A/B/C, or 1/2, etc. |
| 13 | `position` | **Yes** | `position_type` | **Yes** | Position type (see values below) |
| 14 | `x` | **Yes** | `x` | **Yes** | Projected X coordinate (State Plane or UTM) |
| 15 | `y` | **Yes** | `y` | **Yes** | Projected Y coordinate (State Plane or UTM) |
| 16 | `long` | **Yes** | `longitude` | **Yes** | WGS84 longitude |
| 17 | `lat` | **Yes** | `latitude` | **Yes** | WGS84 latitude |
| 18 | `cad_parcelles` | | `parcel_ids` | | Parcel IDs (pipe-separated), links to county assessor |
| 19 | `source` | **Yes** | `source` | **Yes** | Organization that created/maintains this data |
| 20 | `date_der_maj` | **Yes** | `date_updated` | **Yes** | Last update date (YYYY-MM-DD) |
| 21 | `certification_commune` | **Yes** | `certified` | **Yes** | 1 = certified by local authority, 0 = not certified |

### Position Type Values (1:1 from INSPIRE/BAL)

| BAL Value (French) | LAB Value (English) | INSPIRE Equivalent | Description |
|--------------------|--------------------|--------------------|-------------|
| `délivrance postale` | `postal_delivery` | postal delivery | Mailbox / delivery point |
| `entrée` | `entrance` | entrance | Main entrance door or gate |
| `bâtiment` | `building` | building | Building or part of building |
| `cage d'escalier` | `staircase` | staircase identifier | Staircase inside a building |
| `logement` | `unit` | unit identifier | Dwelling, suite, or room |
| `parcelle` | `parcel` | parcel | Land parcel |
| `segment` | `segment` | segment | Derived from road centerline |
| `service technique` | `utility` | utility service | Utility access point |

### The Interoperability Key (1:1 Port)

France's `cle_interop` is genius in its simplicity. It's a human-readable, locally-constructible unique key:

**French format**: `{INSEE_5}_{FANTOIR_4}_{NUMBER_5}_{SUFFIX}`
Example: `35250_1658_00021_bis`

**US equivalent**: `{FIPS_5}_{STREETCODE_4}_{NUMBER_5}_{SUFFIX}`
Example: `20045_0128_00415_a`

Where:
- `20045` = FIPS code (Kansas, Douglas County)
- `0128` = Local street code (or temp code `x042` if no official code exists)
- `00415` = Address number, zero-padded to 5 digits
- `a` = Suffix (optional)

This key is simple enough that any jurisdiction can construct it with minimal tooling, and it's unique nationwide without a central authority assigning IDs.

### What's Intentionally NOT in the Minimal Schema

These fields exist in NAD/NENA but are **deferred to Phase 3** expansion:

| NAD/NENA Field | Why Deferred |
|----------------|-------------|
| `AddNum_Pre`, `St_PreMod`, `St_PreDir`, etc. | Parsed components of `street_name` — can be auto-derived later |
| `County`, `Inc_Muni`, `Uninc_Comm` | Derived from `jurisdiction_fips` via lookup |
| `State`, `Zip_Code`, `Plus_4` | Derived from `jurisdiction_fips` + geocoding |
| `Addr_Type` (residential/commercial) | Enrichment data, not core addressing |
| `Placement` method | Internal metadata, not needed from submitters |
| `NatAmArea`, `NatAmSub`, `Urbnztn_PR` | Specialized fields — added in Phase 3 |
| `Building`, `Floor`, `Room`, `Seat` | Subaddress detail — Phase 3 expansion |

**Key insight**: The full NAD can be **generated from** our minimal schema by combining it with reference datasets (FIPS lookup tables, USPS ZIP databases, Census TIGER). The submitter doesn't need to provide 40 fields — we derive them.

### Multilingual Support (1:1 Port of BAL Approach)

France's BAL handles regional languages (Basque, Breton, Corsican) by **suffixing column names** with ISO 639-2 language codes. We replicate this exactly:

| BAL Pattern | LAB Pattern | Example |
|-------------|-------------|---------|
| `voie_nom_bre` (Breton) | `street_name_spa` (Spanish) | `Calle Principal` |
| `commune_nom_eus` (Basque) | `jurisdiction_name_spa` | `Condado de Los Ángeles` |

Fields supporting multilingual values:
- `jurisdiction_name` → `jurisdiction_name_spa`
- `sub_jurisdiction_name` → `sub_jurisdiction_name_spa`
- `street_name` → `street_name_spa`
- `place_name` → `place_name_spa`

This is **identical** to the BAL approach — no new architecture needed.

---

## 6. Platform Architecture: 1:1 Port Strategy

### Naming Convention
| French (BAN) | US Equivalent (Proposed) |
|-------------|------------------------|
| Base Adresse Nationale (BAN) | **National Address Platform (NAP)** |
| Base Adresse Locale (BAL) | **Local Address Base (LAB)** |
| Mes Adresses | **My Addresses** (address editor) |
| API de Dépôt | **Address Depot API** (submission/versioning) |
| BAN Plateforme | **NAP Engine** (integration/consolidation) |
| adresse.data.gouv.fr | **address.data.gov** (public website) |
| Addok | **US Address Geocoder** (geocoding engine) |
| Communes | **Jurisdictions** (counties, cities, townships, etc.) |

### 1:1 Port Approach Per Component

The goal is to **fork each repository, translate the UI to English, swap the data model references (INSEE → FIPS, communes → jurisdictions), and get a functional system running with US data** before making any architectural changes.

#### A. Public Website — Fork `adresse.data.gouv.fr`
- **Port scope**: Translate all French UI text to English, set up i18n with `next-intl`
- **Swap**: French map tiles → US map tiles (OpenStreetMap / MapTiler)
- **Swap**: French administrative boundaries → US (states, counties from Census TIGER)
- **Swap**: French gov branding → neutral US branding
- **Keep identical**: Page structure, navigation, search UX, map explorer, download pages

#### B. My Addresses Editor — Fork `mes-adresses`
- **Port scope**: Translate UI, keep the identical editing workflow
- **Swap**: `commune` selectors → jurisdiction selectors (state → county → city)
- **Swap**: `code_insee` lookups → FIPS code lookups
- **Swap**: French cadastre map layer → US parcel map layer
- **Keep identical**: Map-based editing, address point placement, tutorial system, BAL/LAB export

#### C. My Addresses API — Fork `mes-adresses-api`
- **Port scope**: Change entity names and schema to LAB fields
- **Swap**: France Connect auth → Login.gov OAuth
- **Swap**: French commune dataset → US jurisdiction dataset (FIPS + Census place names)
- **Swap**: PostgreSQL schema: BAL columns → LAB columns (see mapping table above)
- **Keep identical**: NestJS architecture, TypeORM setup, Redis caching, S3 storage, CRON publishing

#### D. Address Depot API — Fork `api-depot`
- **Port scope**: Change entity names, validation rules
- **Swap**: French authorization model → US authorization (jurisdiction-based)
- **Swap**: BAL file validation → LAB file validation
- **Keep identical**: Versioning system, publication pipeline, webhook notifications

#### E. NAP Engine — Fork `ban-plateforme`
- **Port scope**: Change import/export scripts, consolidation logic
- **Swap**: French data sources → US data sources (NAD baseline, TIGER)
- **Swap**: French contours (administrative boundaries) → US boundaries
- **Keep identical**: Express.js API, Redis worker queue, async task processing

#### F. Geocoder — Fork `addok-docker`
- **Port scope**: Configure for US address parsing patterns
- **Swap**: French address tokenization → US address tokenization
- **Keep identical**: Docker deployment, Redis backend, search algorithm

---

## 7. Key Differences: France vs. US (What Changes in the Port)

| Aspect | France (BAN) | US Port (NAP) | Port Complexity |
|--------|-------------|---------------|-----------------|
| **Scale** | ~26M addresses, 36K communes | ~150M addresses, 90K+ jurisdictions | Medium (scaling) |
| **Language** | French only | English + Spanish (i18n) | Medium |
| **Admin Structure** | Communes → Départements → Régions | Cities/Townships → Counties → States | Medium (data swap) |
| **Address Format** | `[number] [type] [name]` | `[number] [street_name]` (full name) | Low (simpler!) |
| **Jurisdiction ID** | INSEE code (5 chars) | FIPS code (5-7 chars) | Low (direct swap) |
| **Authentication** | France Connect / Pro Connect | Login.gov | Medium |
| **Postal System** | Code Postal (5 digits) | ZIP / ZIP+4 | Low (Phase 3 enrichment) |
| **Data Standard** | BAL CSV → LAB CSV | 1:1 port | **Low** |
| **Emergency Services** | Not directly integrated | NG911 export (Phase 3) | Deferred |
| **Open Data License** | Licence Ouverte 2.0 | Public Domain (US Gov) | Trivial |
| **Tribal/Indigenous** | Minimal | Native American areas | Phase 3 |
| **Territories** | DOM-TOM (overseas) | PR, USVI, Guam, AS, CNMI, DC | Phase 2 |
| **Map Tiles** | French IGN / OSM | US OpenStreetMap / MapTiler | Low |
| **Cadastre/Parcels** | French DGFiP cadastre | County assessor parcels | Phase 2 |

---

## 8. Implementation Roadmap (Revised: Minimal Schema First)

### Phase 1: 1:1 Port (Months 1-4)
**Goal**: Get the French system running with US data. Minimal changes.

- [ ] Fork all 6 BAN repositories
- [ ] Set up monorepo or linked repos structure
- [ ] Translate all UI text: French → English (set up `next-intl` for future Spanish)
- [ ] Swap BAL schema → LAB schema (1:1 field mapping, ~20 fields)
- [ ] Replace INSEE codes → FIPS codes throughout
- [ ] Replace French commune dataset → US jurisdictions (from Census)
- [ ] Replace French map tiles → US map tiles
- [ ] Replace France Connect → Login.gov (or simple email auth for testing)
- [ ] Deploy on standard cloud (not GovCloud yet — just prove it works)
- [ ] Import sample data: pick 1-2 counties, create LAB files manually
- [ ] **Validate**: Can a user create/edit/publish a Local Address Base?

### Phase 2: US Adaptation (Months 5-8)
**Goal**: Handle US-specific needs while keeping the minimal schema.

- [ ] Spanish language version (i18n framework already in place)
- [ ] US-specific jurisdiction hierarchy (state → county → city/township/tribal)
- [ ] ZIP code enrichment (auto-derive from geocode, not required from submitter)
- [ ] US parcel data integration (county assessor GIS layers)
- [ ] State-level aggregation view (states collect from counties)
- [ ] Import existing NAD data as baseline (transform NAD → LAB)
- [ ] Import Census TIGER/Line address ranges as supplementary
- [ ] US geocoder configuration (Addok with US address patterns)
- [ ] US territories support (PR, USVI, Guam, DC, etc.)
- [ ] Pilot with 3-5 willing jurisdictions

### Phase 3: Schema Expansion & Standards Compliance (Months 9-14)
**Goal**: Expand the minimal schema to generate full NENA/NAD-compliant exports.

- [ ] Address parsing engine: `street_name` → decomposed NAD fields (`St_PreDir`, `St_Name`, `St_PosTyp`, etc.)
- [ ] NAD-format export generator (LAB → NAD schema auto-transform)
- [ ] NENA NG911-format export generator
- [ ] Census MAF/TIGER compatible export
- [ ] FGDC-STD-016-2011 metadata generation
- [ ] NG911 compliance scoring per jurisdiction
- [ ] Advanced subaddress support (Building, Floor, Unit, Room)
- [ ] Native American area / tribal land handling
- [ ] Puerto Rico urbanización support
- [ ] Quality scoring and validation dashboard

### Phase 4: National Scale & Launch (Months 15-20)
- [ ] FedRAMP / GovCloud migration
- [ ] National rollout with training program
- [ ] Open-source geocoder release (Docker-deployable)
- [ ] Census Bureau integration pipeline
- [ ] Real-time national coverage map
- [ ] Public launch

---

## 9. Why Minimal Schema Wins: The Math

France's BAL v1.1 (2016) had **13 fields**. In 6 years, they got **27,000+ municipalities** submitting data.

The US NAD schema has **40+ fields**. In 9 years (since 2017), participation is still **patchy and varies widely by state**.

The math is simple:

| Metric | BAL (Minimal) | NAD (Full) |
|--------|---------------|------------|
| Fields to fill | ~15 (10 required) | 40+ |
| Time to create 1 address | ~30 seconds | ~3-5 minutes |
| Technical skill required | Spreadsheet | GIS software |
| Validation complexity | Simple (is it a number? are coords valid?) | Complex (parsed street components, address type taxonomy) |
| Cost to participate | $0 (browser-based tool) | $$$$ (ArcGIS license, trained staff) |

**Our approach**: Start with 15 fields. Automatically derive the other 25+ from reference data and parsing algorithms. The submitter does 30 seconds of work; our system does the rest.

---

## 10. Stakeholder Benefits

### For Local Jurisdictions (Counties, Cities, Townships)
- Free, no-code web tool to manage addresses
- Automatic validation against national standards
- NG911 compliance checking
- Eliminates need for expensive GIS software

### For State Address Programs
- Standardized pipeline for collecting county/city data
- Dashboard for statewide address coverage
- Automatic aggregation and conflict resolution
- NG911 readiness reporting

### For the National Address Database (NAD)
- Continuous data flow from local authorities (not periodic bulk submissions)
- Versioned, quality-scored data
- Standardized schema compliance
- Real-time national address coverage map

### For the US Census Bureau
- Improved address data for census operations
- Supplementary data to MAF/TIGER
- Better coverage of hard-to-count areas
- Geocoding quality improvements

### For NG911 / Emergency Services
- Accurate, geocoded address points
- Standardized NENA-compliant data
- Continuous updates (not annual snapshots)
- Coverage gap identification

### For the Public
- Free address search and geocoding
- Address verification tool
- Open data downloads
- Bilingual access (English/Spanish)

---

## 9. Technical Requirements

### Infrastructure
- **Cloud**: AWS GovCloud or cloud.gov (FedRAMP compliance)
- **Database**: PostgreSQL 16+ with PostGIS 3.4+
- **Cache**: Redis 7+
- **Storage**: S3-compatible object storage
- **CDN**: CloudFront or equivalent
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Prometheus/Grafana

### Security & Compliance
- FedRAMP authorization
- FISMA compliance
- ATO (Authority to Operate)
- Login.gov for authentication
- Section 508 accessibility
- WCAG 2.1 AA compliance

### Performance Targets
- Geocoding API: <100ms response time
- Address search: <200ms autocomplete
- Map rendering: 60fps at national scale
- Data freshness: Weekly national updates, daily for active jurisdictions

---

## 12. Next Steps (Immediate)

1. **DONE** — Forked all 6 BAN repositories to GitHub (Loprz)
2. **DONE** — Cloned all repos locally, created `us-port` branch on each
3. **DONE** — Created LAB v1.0 specification document
4. **Set up project-level README** and link all repos
5. **Begin auditing `mes-adresses`** (editor) — catalog all French strings for translation
6. **Build a US jurisdictions dataset** from Census FIPS codes
7. **Test Overture data import** — pull a sample county and convert to LAB format
8. **Start i18n framework** on `mes-adresses` (English primary, Spanish secondary)

---

## 13. Overture Maps Foundation: Strategic Data Partner

### Overview
The **Overture Maps Foundation** (Linux Foundation project, backed by Amazon, Meta, Microsoft, TomTom) maintains an open dataset of **446+ million address points** globally, including **121.5 million US addresses** — already geocoded and openly licensed.

### Why This Matters
Overture's US address data gives us an **enormous head start**:
- **121.5M US addresses** already geocoded with point geometry
- **Monthly updates** from 175+ sources (including NAD itself, OpenAddresses, municipal open data)
- **Cloud-native access** via GeoParquet on S3 — queryable with DuckDB without downloading everything
- **Open license** (ODbL/CDLA) compatible with public domain US government use
- **Building footprints** theme can be cross-referenced with address points

### Overture Address Schema (Already Minimal!)
Overture's schema is remarkably similar to our LAB approach:

| Overture Field | LAB Equivalent | Notes |
|---------------|---------------|-------|
| `id` | `id_nap_address` | GERS UUID |
| `geometry` (Point) | `longitude` + `latitude` | WGS84 point |
| `country` | (derived from `jurisdiction_fips`) | ISO 3166-1 alpha-2 |
| `postcode` | (Phase 3 enrichment) | ZIP code |
| `street` | `street_name` | Full street name |
| `number` | `number` | Address number (string in Overture) |
| `unit` | `suffix` | Suite/apt/floor |
| `address_levels[0]` | `jurisdiction_fips` → state | State abbreviation |
| `address_levels[1]` | `jurisdiction_name` | Municipality name |

### Integration Strategy

**Phase 1 — Baseline Import**: Use Overture's 121.5M US addresses as the initial national dataset
```
DuckDB Query → Filter country='US' → Transform to LAB format → Load into NAP Engine
```

**Phase 2 — Gap Analysis**: Compare Overture coverage against NAD data to identify missing areas
- States/counties with low Overture coverage → priority for local authority outreach
- Areas where Overture has data but NAD doesn't → immediate wins

**Phase 3 — Continuous Sync**: Overture updates monthly; our platform can ingest diffs
- New Overture addresses → flagged as "unverified" in our system
- Local authorities can then certify/correct them via My Addresses editor
- Corrections flow back to Overture via open data publishing

**Phase 4 — Building Conflation**: Link address points to Overture building footprints
- Improves position accuracy (rooftop vs. parcel centroid)
- Enables structure-level addressing for NG911

### Sample DuckDB Query: Extract US Addresses for a County
```sql
LOAD spatial;
LOAD httpfs;
SET s3_region='us-west-2';

COPY (
  SELECT
    id,
    number AS address_number,
    street AS street_name,
    unit AS suffix,
    postcode AS zip_code,
    address_levels[1].value AS state,
    address_levels[2].value AS municipality,
    ST_X(geometry) AS longitude,
    ST_Y(geometry) AS latitude
  FROM read_parquet(
    's3://overturemaps-us-west-2/release/2026-01-21.0/theme=addresses/type=address/*',
    filename=true, hive_partitioning=1
  )
  WHERE country = 'US'
    AND bbox.xmin > -95.35 AND bbox.xmax < -95.15
    AND bbox.ymin > 38.90  AND bbox.ymax < 39.00
) TO 'douglas_county_ks_addresses.csv';
```

### Potential Partnership Value
Overture Maps Foundation would likely be interested in this project because:
1. **Better US data quality** — our platform creates a feedback loop where local authorities verify/correct addresses
2. **Standardized submission pipeline** — local governments submit data in a simple format that can flow to Overture
3. **Government adoption** — a US government-backed platform using Overture data validates their mission
4. **Schema alignment** — our minimal LAB format is philosophically identical to Overture's approach

---

## Appendix A: BAN Repository Links (Upstream)

| Repository | Description | URL |
|-----------|-------------|-----|
| Organization | All repos | https://github.com/BaseAdresseNationale/ |
| Public Website | adresse.data.gouv.fr (161 stars) | https://github.com/BaseAdresseNationale/adresse.data.gouv.fr |
| Address Editor (UX) | Mes Adresses | https://github.com/BaseAdresseNationale/mes-adresses |
| Address Editor (API) | Mes Adresses API | https://github.com/BaseAdresseNationale/mes-adresses-api |
| Submission Pipeline | API de Dépôt | https://github.com/BaseAdresseNationale/api-depot |
| Integration Platform | BAN Plateforme | https://github.com/BaseAdresseNationale/ban-plateforme |
| Geocoder (Docker) | Addok Docker (184 stars) | https://github.com/BaseAdresseNationale/addok-docker |
| Postal Codes | Codes Postaux (60 stars) | https://github.com/BaseAdresseNationale/codes-postaux |

## Appendix B: Forked Repositories (Loprz / us-port branch)

| Repository | Fork URL | Branch |
|-----------|----------|--------|
| Public Website | https://github.com/Loprz/adresse.data.gouv.fr | `us-port` |
| Address Editor (UX) | https://github.com/Loprz/mes-adresses | `us-port` |
| Address Editor (API) | https://github.com/Loprz/mes-adresses-api | `us-port` |
| Submission Pipeline | https://github.com/Loprz/api-depot | `us-port` |
| Integration Platform | https://github.com/Loprz/ban-plateforme | `us-port` |
| Geocoder (Docker) | https://github.com/Loprz/addok-docker | `us-port` |

## Appendix C: US Addressing Resources

| Resource | URL |
|----------|-----|
| NAD (National Address Database) | https://www.transportation.gov/gis/national-address-database |
| NAD Schema (April 2023) | https://www.transportation.gov/gis/nad/nad-schema |
| FGDC Address Standard | https://www.fgdc.gov/standards/projects/address-data |
| NENA NG911 Standards | https://www.nena.org/page/NG911Standards |
| Census TIGER/Line | https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html |
| USPS Publication 28 | https://pe.usps.com/text/pub28/welcome.htm |
| Login.gov | https://login.gov |

## Appendix D: Overture Maps Foundation Resources

| Resource | URL |
|----------|-----|
| Overture Maps Docs | https://docs.overturemaps.org/ |
| Address Theme Guide | https://docs.overturemaps.org/guides/addresses/ |
| Address Schema Reference | https://docs.overturemaps.org/schema/reference/addresses/address/ |
| Data Access Guide | https://docs.overturemaps.org/getting-data/ |
| US Address Data (S3) | `s3://overturemaps-us-west-2/release/2026-01-21.0/theme=addresses/type=address/*` |
| Building Footprints (S3) | `s3://overturemaps-us-west-2/release/2026-01-21.0/theme=buildings/type=building/*` |
| GitHub: Data Issues | https://github.com/OvertureMaps/data/issues |
| GitHub: Schema | https://github.com/OvertureMaps/schema |
| Python CLI Tool | https://github.com/OvertureMaps/overturemaps-py |
