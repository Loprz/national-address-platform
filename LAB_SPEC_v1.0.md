# Local Address Base (LAB) Format Specification
## Version 1.0 — Draft

**US equivalent of France's BAL (Base Adresse Locale) v1.4**

---

## Purpose

The Local Address Base (LAB) format is a **deliberately minimal CSV schema** designed to:

1. Standardize address data exchange from local jurisdictions across the United States
2. Lower the barrier to entry so **any jurisdiction** can participate, regardless of technical capacity
3. Enable aggregation into a national address database
4. Serve as the input format for the National Address Platform (NAP)

The LAB format is directly modeled on France's BAL (Base Adresse Locale) v1.4, which successfully enabled 27,000+ French municipalities to contribute address data using just ~15 required fields.

**Design principle**: Ask for only what the local authority actually knows. Derive everything else from reference data.

---

## CSV File Specification

| Property | Value |
|----------|-------|
| Encoding | UTF-8 |
| Field separator | Semicolon (`;`) |
| String enclosure | None (no quotes) |
| Decimal separator | Period (`.`) |
| Date format | `YYYY-MM-DD` |
| Coordinate precision | 2 decimal places (projected), 7 decimal places (WGS84) |
| Line ending | LF or CRLF |

**Why semicolon?** Street names can contain commas (e.g., "Martin Luther King, Jr Boulevard"). Following the BAL convention, semicolons avoid ambiguity without requiring string quoting.

---

## Schema

### Field Definitions

| # | Field Name | Required | Type | Description |
|---|-----------|----------|------|-------------|
| 1 | `id_nap_jurisdiction` | | UUID v4 | Jurisdiction ID assigned by the national platform |
| 2 | `id_nap_street` | | UUID v4 | Street/road ID assigned by the national platform |
| 3 | `id_nap_address` | | UUID v4 | Address ID assigned by the national platform |
| 4 | `interop_key` | **Yes** | String | National interoperability key (see construction rules below) |
| 5 | `jurisdiction_fips` | **Yes** | String(5-7) | FIPS code: state (2) + county (3), optionally + place (2+) |
| 6 | `jurisdiction_name` | **Yes** | String | Official name of the jurisdiction (city, county, township) |
| 7 | `sub_jurisdiction_fips` | | String(5-7) | FIPS code for sub-jurisdiction (consolidated cities, etc.) |
| 8 | `sub_jurisdiction_name` | | String | Sub-jurisdiction name |
| 9 | `street_name` | **Yes** | String | Full street name, properly cased (e.g., "North Main Street") |
| 10 | `place_name` | | String | Locality, neighborhood, subdivision, or landmark name |
| 11 | `number` | **Yes** | Integer | Address number (use `99999` for streets with no addresses) |
| 12 | `suffix` | | String | Repetition suffix: A, B, 1/2, or unit designator |
| 13 | `position_type` | **Yes** | Enum | Type of position (see values below) |
| 14 | `x` | **Yes** | Decimal | Projected X coordinate (State Plane or UTM) |
| 15 | `y` | **Yes** | Decimal | Projected Y coordinate (State Plane or UTM) |
| 16 | `longitude` | **Yes** | Decimal | WGS84 longitude (7 decimal places) |
| 17 | `latitude` | **Yes** | Decimal | WGS84 latitude (7 decimal places) |
| 18 | `parcel_ids` | | String | Parcel ID(s), pipe-separated. Format varies by county. |
| 19 | `source` | **Yes** | String | Name of the organization that created/maintains this data |
| 20 | `date_updated` | **Yes** | Date | Last update date (YYYY-MM-DD) |
| 21 | `certified` | **Yes** | Integer(0\|1) | 1 = certified by local authority, 0 = not certified |

**Total: 21 fields, 12 required.**

### Aliases Accepted on Import

| Alias | Resolves To |
|-------|-------------|
| `lon` | `longitude` |
| `long` | `longitude` |
| `lat` | `latitude` |
| `fips` | `jurisdiction_fips` |
| `addr_number` | `number` |
| `address_number` | `number` |

---

## Position Type Values

| Value | INSPIRE Equivalent | Description |
|-------|-------------------|-------------|
| `postal_delivery` | postal delivery | Mailbox or delivery point |
| `entrance` | entrance | Main entrance door, gate, or driveway |
| `building` | building | Building or part of building |
| `staircase` | staircase identifier | Staircase inside a building |
| `unit` | unit identifier | Dwelling, apartment, suite, or room |
| `parcel` | parcel | Land parcel centroid |
| `segment` | segment | Derived from road centerline segment |
| `utility` | utility service | Utility access point (meter, shutoff valve) |
| `rooftop` | — | Rooftop centroid (common in US GIS data) |
| `structure` | — | Structure point (common in US NG911 data) |

Note: `rooftop` and `structure` are US additions not present in the French BAL. They align with common US address point placement methods used in NG911 and county GIS programs.

---

## Interoperability Key Construction

The `interop_key` is a human-readable, locally-constructible unique identifier for an address:

```
{FIPS_5}_{STREET_CODE_4}_{NUMBER_5}_{SUFFIX}
```

### Rules
- FIPS code: 5 characters (state 2 + county 3)
- Street code: 4 characters. Use local street code or temporary code starting with `x` (e.g., `x042`)
- Number: 5 characters, zero-padded (e.g., `00415`)
- Suffix: lowercase, variable length, optional
- Separator: underscore (`_`)
- All lowercase

### Examples
```
20045_0128_00415
20045_0128_00415_a
48201_1347_01200_apt3b
06037_x042_00100
72001_0089_00001_1/2
```

### Temporary Street Codes
If no official street code exists, create a temporary code starting with `x` and incrementing uniquely within the jurisdiction:
- `x001`, `x002`, `x003`, ...

These should be replaced with official codes when assigned.

---

## Multilingual Support

For jurisdictions with bilingual address needs (particularly Spanish), additional columns are added using ISO 639-2 language code suffixes:

| Base Field | Spanish Column |
|-----------|----------------|
| `jurisdiction_name` | `jurisdiction_name_spa` |
| `sub_jurisdiction_name` | `sub_jurisdiction_name_spa` |
| `street_name` | `street_name_spa` |
| `place_name` | `place_name_spa` |

Spanish columns are placed **after** all standard columns. The English values in the base fields are always the primary/official names.

### Example
```
street_name;...;street_name_spa
North Main Street;...;Calle Principal Norte
```

Additional language codes can be added following the same pattern:
- `_nav` — Navajo
- `_haw` — Hawaiian
- `_smo` — Samoan
- `_cha` — Chamorro (Guam)

---

## Streets Without Addresses

Following the BAL convention, streets/roads that exist but have no assigned address numbers use the special number `99999`.

This allows the system to track named roads even before addresses are assigned — critical for rural areas and new developments.

---

## File Naming Convention

```
YYYYMMDD_lab_{FIPS}_{sourcename}.csv
```

Examples:
- `20260207_lab_20045_douglascountyks.csv`
- `20260207_lab_48201_harriscountytx.csv`
- `20260207_lab_06037_lacountygis.csv`

Rules:
- Date: creation date of the dataset
- FIPS: 5-digit state+county FIPS
- Source name: lowercase, no spaces, no hyphens, no diacritics
- Extension: `.csv`

Optional: accompany with `.md5` or `.sha256` checksum file.

---

## Sample Data

```csv
interop_key;jurisdiction_fips;jurisdiction_name;street_name;number;suffix;position_type;x;y;longitude;latitude;source;date_updated;certified
20045_0128_00415;20045;Lawrence;North Iowa Street;415;;entrance;826744.21;4312567.89;-95.2358741;38.9717623;Douglas County GIS;2026-01-15;1
20045_0128_00417;20045;Lawrence;North Iowa Street;417;;entrance;826751.43;4312572.11;-95.2357892;38.9718012;Douglas County GIS;2026-01-15;1
20045_0293_01200;20045;Lawrence;West 6th Street;1200;;building;826289.67;4312198.45;-95.2412356;38.9684521;Douglas County GIS;2026-01-15;1
20045_0293_01200;20045;Lawrence;West 6th Street;1200;a;unit;826291.12;4312199.03;-95.2412189;38.9684578;Douglas County GIS;2026-01-15;0
20045_x001_99999;20045;Lawrence;County Road 1057;;;segment;827102.89;4313001.22;-95.2301456;38.9756789;Douglas County GIS;2026-01-15;0
```

---

## Relationship to NAD / NENA / FGDC

The LAB format is **not a replacement** for NAD, NENA, or FGDC standards. It is a **submission format** designed to make data collection easy. The National Address Platform automatically transforms LAB data into:

| Target Format | How |
|--------------|-----|
| **NAD Schema** | Parse `street_name` into components (`St_PreDir`, `St_Name`, `St_PosTyp`, etc.); derive `State`, `County`, `Zip_Code` from `jurisdiction_fips` + geocode |
| **NENA NG911** | Map to NENA Site/Structure Address Table; derive MSAG community from jurisdiction |
| **FGDC-STD-016** | Map to thoroughfare address type; generate metadata |
| **Census TIGER** | Generate address range features from point data |

**The submitter provides 12 required fields. The system derives the rest.**

---

## Validation Rules

A valid LAB file must:

1. Be UTF-8 encoded CSV with semicolon separators
2. Have all required fields present in the header row
3. Have `jurisdiction_fips` as a valid US FIPS code
4. Have `number` as a positive integer or `99999`
5. Have `longitude` between -180 and -60 (Western Hemisphere)
6. Have `latitude` between 17 and 72 (US territory range)
7. Have `position_type` as one of the defined enum values
8. Have `date_updated` as a valid `YYYY-MM-DD` date
9. Have `certified` as `0` or `1`
10. Have `interop_key` matching the construction pattern `{FIPS}_{CODE}_{NUMBER}[_{SUFFIX}]`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02 | Initial specification, 1:1 port of French BAL v1.4 |

---

## Credits

This specification is directly derived from the **Format Base Adresse Locale v1.4** (September 2023), published by the AITF SIG Topo working group (Association des Ingénieurs Territoriaux de France). The original specification and the BAN platform are open-source projects of the French government.

We gratefully acknowledge the work of the French addressing community whose minimal-schema approach proved that simplicity drives adoption.
