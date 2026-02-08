# Audit Report: National Address Platform (NAP) Port

## Summary — Frontend + Backend + GERS Integration + E2E Verified + Deep Translation
- **Frontend (mes-adresses)**: Fully ported — 700+ French strings translated, map config swapped, legal pages rewritten, data model terms updated, i18n configured (en/es)
- **Backend API (mes-adresses-api)**: Core porting complete — FIPS code system replaces French COG, 60+ French strings translated, S3/BAN services made resilient for local dev
- **Email Templates**: All 6 Handlebars email templates translated to English (creation, publication, recovery, admin invite, token renewal)
- **PDF Templates**: All 3 PDF generators translated (street numbering order, address certificate); date locale changed from fr-Fr to en-US
- **Overture Maps / GERS**: Full integration — GERS IDs on all entities, bidirectional API, spatial matching, CSV export with GERS column
- **Local Dev Environment**: Docker Compose with PostgreSQL+PostGIS and Redis, API running on port 5050, 13 DB migrations applied
- **Frontend ↔ Backend E2E**: Fully verified — jurisdiction search, LAB creation wizard, street/number CRUD all working through the browser

## Email Templates Translation (Phase 7)

### Translated Templates
| Template | Subject | Description |
|----------|---------|-------------|
| `bal-creation-notification.hbs` | New Local Address Base Created | Sent when a new LAB is created |
| `bal-publication-notification.hbs` | Your Local Address Base Has Been Published | Sent when LAB is published to national database |
| `bal-renewal-notification.hbs` | Local Address Base Token Renewal | Sent when admin token is renewed |
| `new-admin-notification.hbs` | Invitation to Manage a Local Address Base | Sent when a new admin is invited |
| `recovery-notification.hbs` | Request to Recover Your Local Address Bases | Sent for account recovery by email |
| `recovery-commune-notification.hbs` | Request to Recover the Local Address Base of {jurisdiction} | Sent for recovery via jurisdiction email |

### Email Subject Lines Updated
| French | English |
|--------|---------|
| Création d'une nouvelle Base Adresse Locale | New Local Address Base created |
| Publication de votre Base Adresse Locale | Your Local Address Base Has Been Published |
| Renouvellement de jeton de Base Adresse Locale | Local Address Base Token Renewal |
| Invitation à l'administration d'une BAL | Invitation to administer a Local Address Base |
| Demande de récupération de vos BAL | Recovery request for your Local Address Bases |
| Demande de récupération de la BAL de {commune} | Recovery request for the Local Address Base of {jurisdiction} |

## PDF Templates Translation (Phase 6)

### Translated Documents
| Template | French Title | English Title |
|----------|-------------|---------------|
| `voie/arrete-de-numerotation.ts` | Arrêté de numérotation (voie) | Street Numbering Order (street) |
| `numero/arrete-de-numerotation.ts` | Arrêté de numérotation (numéro) | Street Numbering Order (number) |
| `numero/certificat-adressage.ts` | Certificat d'adressage | Address Certificate |

### Key Changes
| French | English |
|--------|---------|
| Le Maire de la commune de | The Jurisdiction Authority of |
| Vu le code général des collectivités territoriales | Pursuant to applicable state and local addressing ordinances |
| ARRÊTÉ | IT IS HEREBY ORDERED |
| Article 1: L'accès aux locaux se fait par la voie | Section 1: Access to the properties is via |
| Numéro / Parcelle(s) cadastrale(s) associée(s) | Number / Associated Parcel(s) |
| Plan de situation | Site Plan |
| Je, soussigné(e)... atteste que | I, the undersigned... certify that |
| En foi de quoi, le présent certificat est délivré | In witness whereof, this certificate is issued |
| Date locale: fr-Fr | Date locale: en-US |

## Backend Deep Translation (Phase 7)

### Validation Messages (DTOs)
| French | English | File |
|--------|---------|------|
| Le champ nom est obligatoire | The name field is required | create_voie.dto.ts, create_toponyme.dto.ts |
| Le champ numero est obligatoire | The number field is required | create_numero.dto.ts |

### Service Error Messages
| French | English | File |
|--------|---------|------|
| L'identifiant de l'habilitation est invalide | The authorization ID is invalid | habilitation.service.ts |
| Aucune demande d'habilitation en attente | No pending authorization request | habilitation.service.ts |
| Le code commune est requis | The jurisdiction code is required | base_locale.service.ts |
| La synchronisation pas possibles pour les BAL de démo | Synchronization is not possible for demo LABs | publication.service.ts |
| Aucune habilitation rattachée à cette BAL | No authorization attached to this LAB | publication.service.ts |
| La base locale ne possède aucune adresse | The LAB has no addresses | publication.service.ts |
| Le statut de synchronisation doit être "synced" ou "outdated" | The sync status must be "synced" or "outdated" | publication.service.ts |
| Export BAL non valide | Invalid LAB export | api_depot.service.ts |
| La fichier BAL n'est pas valide | The LAB file is not valid | api_depot.service.ts |
| Il manque une date from ou to | Missing a "from" or "to" date | dates.utils.ts |
| Les dates ne sont pas valides | The dates are not valid | dates.utils.ts |
| Toponyme introuvable dans la base de données | Place name not found in the database | export_csv_bal.utils.ts |
| Les adresses emails ne peut pas être utilisée | The email addresses cannot be used | annuaire-service-public.ts |

## Frontend Deep Translation (Phase 7)

### Action Buttons Fixed
| French | English | Files |
|--------|---------|-------|
| Modifier | Edit | voies/page.tsx, toponymes/page.tsx, numeros-list.tsx, help/numeros.tsx |
| Supprimer… | Delete… | voies/page.tsx, toponymes/page.tsx, numeros-list.tsx, numero-marker.tsx |
| Fermer | Close | authentication_rejected.tsx, publish-bal-rejected.tsx, publish-bal.tsx, purge dialog, signalement-viewer.tsx |
| Certifier | Certify | voies/page.tsx |
| Accepter | Accept | signalement-form-buttons.tsx |
| Retour | Back | signalement-form-buttons.tsx |
| Chargement… | Loading… | habilitation-process/index.tsx |
| Ajouter | Add | help/voies.tsx |
| Ajouter un numéro | Add a number | help/numeros.tsx |

### Confirmation Dialogs Fixed
| French | English |
|--------|---------|
| Êtes vous bien sûr de vouloir certifier toutes les adresses de cette voie ? | Are you sure you want to certify all addresses on this street? |
| Êtes vous bien sûr de vouloir convertir cette voie en toponyme ? | Are you sure you want to convert this street to a place name? |
| Êtes vous bien sûr de vouloir supprimer cette voie ainsi que tous ses numéros ? | Are you sure you want to delete this street and all its numbers? |
| confirmLabel="Supprimer" | confirmLabel="Delete" |

### Recovery, Auth & Reports
| French | English |
|--------|---------|
| Vous ne retrouvez pas vos BAL ? Pour les récupérer par courriel | Can't find your LABs? Recover them by email |
| Cliquez ici | Click here |
| Renseigner la commune dont vous voulez récupérer les BAL | Enter the jurisdiction for which you want to recover the LABs |
| Authentification de la mairie | Jurisdiction Authentication |
| Vous n'avez pas reçu votre code ? | Didn't receive your code? |
| Consultez vos spams | Check your spam folder |
| Renvoyez le code | Resend the code |
| Recevoir un code d'habilitation | Receive an authorization code |
| Elle permet de s'assurer que la publication est... | Authorization ensures that the publication is... |
| Signalement non pertinent / en double / non conforme | Irrelevant / Duplicate / Non-compliant report |

### Map & UI Elements
| French | English |
|--------|---------|
| Fermer l'outil de mesure | Close measurement tool |
| Mesurer une distance | Measure a distance |
| Choix du fond de carte | Choose map style |
| Certifié | Certified |
| certifié(s) | certified |
| Aucun numero | No numbers |
| Tous les numeros certifiés | All numbers certified |
| Chercher une commune… | Search for a jurisdiction… |
| Choisir une voie | Select a street |
| Adresse actuelle | Current address |
| Ce toponyme n'a pas de position | This place name has no position |
| Modification de type | Type modification |
| Pas de modification | No modification |

### Component Content
| French | English |
|--------|---------|
| Les adresses certifiées par la commune sont marquées comme fiables... | Addresses certified by the jurisdiction are marked as reliable... |
| Vous êtes en mode consultation... | You are in read-only mode... |
| Votre navigateur Internet Explorer n'est plus supporté | Your browser Internet Explorer is no longer supported |
| Pas de formations à venir | No upcoming events |
| Voir tous nos évènements | See all our events |
| Tutoriels vidéos | Video tutorials |
| Pour garantir la qualité de votre BAL... | To ensure the quality of your LAB... |
| Prochain objectif | Next goal |
| Base Adresse Nationale | National Address Database |

## Frontend ↔ Backend Integration

### Jurisdiction Search API
| Component | Details |
|-----------|---------|
| Backend endpoint | `GET /v2/commune/search?nom=<query>&limit=<n>` — searches US jurisdictions (counties) by name, state abbreviation, or FIPS code |
| Search function | `searchJurisdictions()` in `fips.utils.ts` — supports name matching, state abbreviation filtering, exact FIPS lookup |
| Frontend service | `ApiGeoService.searchCommunes()` now calls our backend instead of French `geo.api.gouv.fr` |
| Result format | Compatible with existing frontend — returns `{ code, nom, departement: { code, nom }, _score }` |

### E2E Verified Flows
1. **Create LAB**: Search "Los Angeles" → Select Los Angeles County, CA → Step through wizard → Create demo LAB → Redirect to editor
2. **Add Street**: Navigate to streets page → Click "Add a street" → Enter "Main Street" → Save → Street created
3. **Add Address Number**: Click "Add a number" → Enter 100 → Save → Address created with map marker at position
4. **Map Integration**: MapLibre renders with Stadia Maps tiles, address markers displayed correctly

## Overture Maps / GERS Integration

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
| Jurisdiction search API | `GET /v2/commune/search?nom=<query>` — searches counties by name, state abbreviation, or FIPS code |
| COG validator updated | `ValidatorCogCommune` now validates 5-digit FIPS county codes instead of French INSEE codes |
| Entity updated | `BaseLocale.getCommuneNom()` uses FIPS jurisdiction names (e.g., "Los Angeles County, CA") |
| Commune service | Returns US jurisdiction data (map capability flags, no overseas territory logic) |
| Search query pipe | Uses `isValidFips()` for commune field validation |
| CSV export | Uses FIPS jurisdiction names + GERS IDs in export |
| BAN platform service | Falls back to local UUID generation when BAN platform is unavailable |
| S3 service | Gracefully handles missing S3 configuration (warns instead of crashing) |
| French error messages | 60+ strings translated to English across 20+ files |
| API description | Updated to English in `main.ts` |
| **GERS integration** | Full Overture Maps GERS ID support across all entities and API |
| **Email templates** | All 6 Handlebars templates translated to English |
| **PDF templates** | All 3 PDF generators translated; date locale changed to en-US |
| **Validation messages** | All DTO validation messages translated |
| **Service errors** | All HTTP exception messages translated |
| **Annuaire service** | Made resilient (returns null if API_ETABLISSEMENTS_PUBLIC not configured) |

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
- `GET /v2/commune/search?nom=Los Angeles` — Searches jurisdictions (tested: returns LA County with score 0.9)
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
| Phase 6 | Frontend ↔ Backend E2E integration | Complete |
| Phase 7 | Email/PDF templates + deep translation sweep | Complete |

### Environment Configuration
- `NEXT_PUBLIC_BAL_API_URL=http://localhost:5050/v2` (points to local API)
- `NEXT_PUBLIC_MAP_TILES_URL=https://tiles.stadiamaps.com/styles/osm_bright.json`
- `NEXT_PUBLIC_MAP_GLYPHS_URL=https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf`

## Remaining Infrastructure Work
1. ~~**Connect frontend to backend** — verify full CRUD flow (create LAB, add streets, add numbers)~~ ✅ DONE
2. **Overture Maps bulk import** — build GeoParquet reader to bulk-import county address data with GERS IDs
3. **US Census TIGER boundary tiles** — enable county/state layers on the map
4. **Authentication system** — adapt authorization flow for US jurisdiction verification
5. **Parcel data source** — integrate US county parcel tile data
6. ~~**PDF templates** — translate French legal document templates to US equivalents~~ ✅ DONE
7. ~~**Email templates** — translate Handlebars email templates to English~~ ✅ DONE
