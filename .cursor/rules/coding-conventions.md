# Coding Conventions

## Language & Framework
- TypeScript for all new code (strict mode)
- Next.js App Router for frontend components
- NestJS for backend APIs
- ES modules (`import/export`), never CommonJS (`require`)

## Git Workflow
- All port work goes on the `us-port` branch of each repo
- Commit messages: `[port] description` for porting changes, `[us] description` for US-specific additions
- Never commit directly to `master`/`main` (that tracks upstream BAN)
- Keep upstream remote synced: `git fetch upstream` periodically

## i18n (Internationalization)
- Use `next-intl` for all user-facing strings
- Message files: `messages/en.json` (English), `messages/es.json` (Spanish)
- Never hardcode UI text in components — always use translation keys
- Key naming: `{page}.{section}.{element}` (e.g., `editor.toolbar.save`)

## French → US Terminology Mapping
When porting, use these consistent replacements:
| French Term | US Term | Code Variable |
|------------|---------|---------------|
| commune | jurisdiction | `jurisdiction` |
| code INSEE | FIPS code | `fipsCode` |
| BAL (Base Adresse Locale) | LAB (Local Address Base) | `localAddressBase` |
| BAN | NAP (National Address Platform) | `nap` |
| voie | street | `street` |
| numéro | number | `addressNumber` |
| suffixe | suffix | `suffix` |
| toponyme | toponym / street name | `toponym` |
| département | state | `state` |
| région | region | `region` |
| parcelle cadastrale | parcel | `parcel` |
| certification commune | certified | `certified` |
| lieu-dit | place name / locality | `placeName` |

## Data Model
- Always reference `LAB_SPEC_v1.0.md` for the canonical field names
- PostgreSQL + PostGIS for all spatial data
- UUIDs (v4) for all entity IDs
- WGS84 (EPSG:4326) for all coordinates
- FIPS codes (not names) as primary jurisdiction identifiers

## Testing
- Jest for unit tests (NestJS APIs)
- Playwright for e2e tests (Next.js frontends)
- Run tests before committing: `yarn test` or `npm test`
- Run linter before committing: `yarn lint` or `npm run lint`

## Accessibility
- WCAG 2.1 AA compliance required
- Section 508 compliance for government use
- All interactive elements must be keyboard-navigable
- All images must have alt text
- Color contrast ratio >= 4.5:1
