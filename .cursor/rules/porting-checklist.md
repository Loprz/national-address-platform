# Porting Checklist — Per Component

When porting any BAN component, follow this checklist:

## 1. UI Text Translation
- [ ] Identify all hardcoded French strings in `.tsx`/`.ts` files
- [ ] Extract strings to `messages/en.json` translation file
- [ ] Set up `next-intl` provider in layout/app
- [ ] Replace hardcoded strings with `useTranslations()` calls
- [ ] Create `messages/es.json` with Spanish translations

## 2. Data Model Swap
- [ ] Replace all `commune` references with `jurisdiction`
- [ ] Replace `code_insee` / `codeInsee` with `fipsCode`
- [ ] Replace `voie` with `street`, `numero` with `addressNumber`
- [ ] Replace `BAL` with `LAB`, `BAN` with `NAP`
- [ ] Update database migrations for new column names
- [ ] Update API DTOs and validation pipes

## 3. Map & Geography
- [ ] Replace French map center coordinates with US center (~39.8, -98.5)
- [ ] Replace French map tiles (IGN) with US tiles (OpenStreetMap/MapTiler)
- [ ] Replace French administrative boundary layers with US (states, counties)
- [ ] Update bounding box constraints (US territory: lat 17-72, lon -180 to -60)
- [ ] Replace French cadastre layer with US parcel data layer

## 4. Authentication
- [ ] Replace France Connect / Pro Connect with Login.gov (or email auth for dev)
- [ ] Update OAuth callback URLs
- [ ] Update user role model if needed

## 5. Branding & Assets
- [ ] Replace French government branding (Marianne, tricolor)
- [ ] Replace `adresse.data.gouv.fr` URLs with local/dev URLs
- [ ] Update favicon, logo, meta tags
- [ ] Remove French-specific legal text (CNIL, etc.)

## 6. Configuration
- [ ] Update `.env.sample` with US-relevant defaults
- [ ] Update API URLs to point to local/US services
- [ ] Update any France-specific external API calls

## 7. Testing
- [ ] Verify the component builds without errors
- [ ] Run existing tests (some will fail — that's expected)
- [ ] Update tests for US data model
- [ ] Test with sample US data
