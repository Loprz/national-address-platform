# Assist Tooling Roadmap — Modern GIS for Small Jurisdictions

Goal: keep the French-BAL simplicity at the surface, but give under-resourced
jurisdictions modern GIS assists so contributing authoritative data is *easier*
than not contributing. The unifying engine is a **local spatial graph** —
the Wherobots "Spatial Graph RAG" pattern applied at county scale.

## The spatial graph is the engine

Wherobots' insight: the most useful relationships in the physical world live in
geometry, not text — *which building contains this address*, *which road segment
provides access*, *which boundary it sits in* — and you build them with spatial
joins, each edge carrying provenance and a confidence score.

For NAP, the same nodes and edges power every assist below:

| Node (Overture theme / NAP) | | Edge | Built by | Powers |
|---|---|---|---|---|
| Address point (NAP / addresses) | → | `CONTAINED_IN` building | point-in-polygon | Structure-point placement, missing/dup detection |
| Address point | → | `ACCESSED_VIA` road segment | nearest-segment (KNN) | **Address-range derivation**, street/side/parity QA |
| Building / address | → | `IN_BOUNDARY` admin area | point-in-polygon | Jurisdiction, MSAG/postal context |
| Address point | ↔ | `LIKELY_SAME_AS` address point | name + proximity | Conflation/dedupe across sources, with evidence |

Every edge stores `{method, distance/overlap, provenance, confidence}` — so the
editor can surface *why* it suggested something and let a clerk accept or reject.
That auditability is also exactly what NG911 discrepancy handling wants.

**You do not need Spark/Wherobots for this at county scale.** The proven
`derive_address_ranges.py` builds the address→segment edges for a whole town with
DuckDB + Shapely in-process. Sedona/Wherobots becomes interesting only if/when we
run the graph nationally in batch — an option, not a dependency. That keeps the
assist affordable for a small county running it themselves.

## Assist features

### 1. Address-range derivation (built, validated)

`scripts/derive_address_ranges.py`. Snaps address points to the
same-named Overture (or authority) centerline, assigns side from segment
direction, and emits NG911 left/right `From/To` ranges + parity. On a Tulare
County sample: 3,169/3,759 points auto-assigned, 0 unmatched street names,
opposite parity per side, 590 low-confidence points flagged for review. This is
the single biggest manual-GIS chore for NG911 centerlines — automated.

### 2. Building-footprint snapping & QA

Overture `buildings` (or county footprints) give `CONTAINED_IN` edges:

- **Place points on structures** — snap a dropped pin to the building centroid /
  rooftop, producing NG911 `Placement = structure/rooftop` for free.
- **Find gaps** — buildings with no address (missing points) and addresses with
  no building (likely geocode error or trailer/ADU).
- **Detect multi-unit** — many addresses in one footprint → prompt for unit
  structure (`Floor`/`Unit`).

### 3. Mapillary street-level imagery

Mapillary's API (vector coverage tiles + image lookup, free with a key) lets the
editor show **street-level imagery** beside the map at the point being edited, so
a clerk can visually confirm the structure, the posted number, and the entrance —
without a site visit. Backend is a thin proxy (cache + key); frontend is a panel.
Later, computer-vision on Mapillary imagery can *suggest* house numbers to
verify against — a richer assist, but the verification panel delivers value first.

### 4. Satellite / aerial basemap placement

A high-resolution imagery basemap (NAIP, or a commercial tile layer) with
**snap-to-footprint** so a clerk can place or correct a point by clicking the
building they see. Combined with #2, dropping a pin near a structure snaps to its
rooftop centroid. This is the lowest-tech, highest-adoption assist — it's how a
non-GIS clerk "just points at the house."

### 5. Conflation / source reconciliation

When a county uploads authority data over an Overture baseline (or two open
sources disagree), `LIKELY_SAME_AS` edges + connected-components clustering turn a
risky blind merge into an **inspectable** one: cluster the candidates, show the
spatial evidence, let the authority confirm. Ties directly into the GERS quality
loop already in the platform.

## Why this helps small / underfunded governments

- They can start with **nothing of their own** — Overture seeds the baseline, the
  assists derive ranges and structure placement, and they only *review*.
- The expensive NG911 deliverables (centerline ranges, structure points) are
  **generated, then verified**, instead of hand-built.
- Everything runs at county scale on a laptop-class box (DuckDB + Shapely); no
  enterprise GIS license, no Spark cluster.
- Authoritative edits flow back through the existing certify/submit pipeline and
  improve the national dataset (and Overture, via GERS).

## Phased plan with estimates

| Phase | Deliverable | Effort | Depends on |
|---|---|---|---|
| A | Centerline range export (wrap the proven script) | S | done script |
| A | Satellite basemap + footprint snap in editor | M | buildings layer |
| B | Building containment QA (gaps, dup, multi-unit) | M | spatial graph builder |
| B | Mapillary verification panel | M | API key + proxy |
| C | Spatial-graph builder (nodes/edges + provenance, DuckDB) | M | — |
| C | Conflation review UI (connected components) | L | graph builder |
| D | CV house-number suggestions from Mapillary | L | imagery pipeline |

Phase A is shippable now: the derivation works, and the basemap/snap is a
front-end + footprint pull. The spatial-graph builder (Phase C) is the shared
substrate the later assists reuse — worth building once, deliberately.

## Relationship to the rest of the platform

- Reuses the Overture loader already built (`load_overture.py`) for baseline data
  and the same release-resolution / provenance conventions.
- Feeds the NG911 export (`NG911_SSAP_MAPPING.md`): centerline ranges and
  structure placement are direct inputs to the SSAP + Road Centerline layers.
- Keeps the editor core minimal — assists are suggestions with provenance, never
  silent mutations.

## References

- Wherobots — *Graph RAG for the Physical World* (Spatial Graph RAG):
  https://wherobots.com/blog/spatial-graph-rag/
- Overture themes: `addresses`, `buildings`, `transportation` (segments),
  `divisions` — https://overturemaps.org/
- Mapillary developer API — https://www.mapillary.com/developer
- NENA-STA-006.3-2026 (NG911 GIS Data Model) — see `NG911_SSAP_MAPPING.md`
