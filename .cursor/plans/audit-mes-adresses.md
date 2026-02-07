# Audit Report: mes-adresses (Editor UX)

## Summary
- **~236 .tsx files** total, **~200+ need changes**
- **~300+ French UI strings translated** to English across 80+ files (Phase 1 + Phase 2 complete)
- **~100 hardcoded French strings remaining** (mostly legal pages, accent-tool data, scattered edge cases)
- **~500+ French data model term instances** (commune, voie, numero, etc.)
- **~40+ French external URLs** (*.gouv.fr)
- **~15+ French map configs** (IGN tiles, Lambert-93, French coords)
- **i18n framework installed and configured** — `next-intl` with English (default) and Spanish

## Tech Stack
- Next.js 16.1.1, React 19.2.3, TypeScript
- MapLibre GL JS 5.15, react-map-gl 8.1
- Evergreen UI 7.1.9 (component library)
- NestJS API client (generated): `openapi-api-bal`
- **`next-intl` ^4.8.2** — configured with App Router integration, `messages/en.json` and `messages/es.json`

## Top Priority Files (Most French Strings)
1. `src/components/help/help-tabs/numeros.tsx` (~50 strings)
2. `src/components/help/help-tabs/voies.tsx` (~40 strings)
3. `src/components/help/help-tabs/toponymes.tsx` (~35 strings)
4. `src/components/help/help-tabs/base-locale.tsx` (~30 strings)
5. `src/lib/statuses.ts` (~25 strings)
6. `src/components/welcome-message.tsx` (~20 strings)
7. `src/components/voie/numeros-list.tsx` (~20 strings)
8. `src/components/signalement/signalement-form/*.tsx` (~15-20 each)
9. `src/components/bal/numero-editor.tsx` (~15 strings)
10. `src/components/new/steps/*.tsx` (~10-15 each)

## Key Directories by Change Density
1. `src/components/help/` — Tutorial content (highest density)
2. `src/lib/openapi-api-bal/` — Generated API client (French model names)
3. `src/components/bal/` — Address editor UI
4. `src/components/signalement/` — Error reporting
5. `src/components/map/styles/` — French map tile URLs
6. `src/contexts/` — Context providers with French data models

## French External URLs to Replace
- `adresse.data.gouv.fr` → US platform URL
- `geo.api.gouv.fr` → US geo API
- `plateforme.adresse.data.gouv.fr` → US NAP engine
- `openmaptiles.geo.data.gouv.fr` → US map tiles
- `tube.numerique.gouv.fr` → US video platform
- `stats.beta.gouv.fr` → US analytics
- `api-lannuaire.service-public.fr` → US public directory

## Map Configuration to Replace
- Center: `46.5693, 1.1771` (France) → `39.8, -98.5` (US)
- Zoom: 6 → 4 (US is bigger)
- Tiles: French IGN/OpenMapTiles → US OSM/MapTiler
- Boundaries: `communes/departements/regions` → `counties/states`
- Cadastre: French DGFiP → US parcel data

## Environment Variables (.env.sample)
All 17 vars point to French *.gouv.fr URLs — all need US equivalents.

## i18n Setup (Completed)
- `next-intl` ^4.8.2 installed and configured
- `src/i18n/request.ts` — locale detection and message loading (static imports for Edge compat)
- `src/i18n/routing.ts` — supported locales: `en` (default), `es`; prefix: `as-needed`
- `messages/en.json` — comprehensive English translations (~185 keys)
- `messages/es.json` — comprehensive Spanish translations (~185 keys)
- `src/app/layout.tsx` — wrapped with `NextIntlClientProvider`, dynamic `lang` attribute
- 5 components use `useTranslations()` (header, footer, welcome-illustration, bases-locales-list, create-bal-card)
- Middleware removed (deprecated in Next.js 16; locale detection via `request.ts`)

## Translated Components (Phase 1 + Phase 2 Complete)
- Header, Footer, Welcome illustration, Welcome message dialog
- Home page: create/recover cards, search, sort controls
- All 8 BAL status messages (`src/lib/statuses.ts`)
- All 10 position types (`src/lib/positions-types-list.ts`)
- Editor toast messages: street, number, place name CRUD (voie-editor, numero-editor, toponyme-editor)
- Map draw hints, geolocation, style control, address creation
- Sidebar toggle tooltips
- Signalement system: report status, form buttons, viewer headers
- Sub-header/sync: all sync status messages, pause/resume, publish
- Trash/restore: delete/restore messages
- Error pages: 404 and global error
- Base locale card, product tour, comment, disabled form input
- **NEW** Settings page: name, admin emails, share access dialog, QR code, map backgrounds
- **NEW** Downloads page: CSV, GeoJSON export links, commenting toggle
- **NEW** Renew token dialog: authorization renewal flow
- **NEW** Mass deletion warning dialog
- **NEW** BAL creation wizard: all 3 steps (search, import, info), navigation buttons
- **NEW** Import data step: CSV upload, validation errors, BAN import, LAB validator link
- **NEW** Published BAL alerts: 7 alert components for existing/published/moissoneur/api-depot
- **NEW** Help documentation: all 5 tabs (Base Locale, Streets, Place Names, Numbers, Publication)
- **NEW** Help infrastructure: problems, unauthorized, sidebar, video container, tuto components
- **NEW** Habilitation/auth flow: publish-bal, published-bal steps
- **NEW** Document generation: addressing certificate dialog
- **NEW** Quality/certification goals, language field, BAL recovery

## Remaining Work Plan
1. Translate legal and accessibility pages (will be US-specific content)
2. Swap map config and external URLs for US geography
3. Update data model terms throughout (INSEE → FIPS, commune → jurisdiction)
4. Replace remaining ~100 scattered French strings (edge cases in less-visited components)
