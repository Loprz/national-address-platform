# US Port Tracker

Last updated: April 12, 2026

## Current Call

- Status: Conditionally ready for Phase 1
- Phase 1 scope: US authoring, certification, publication
- Out of scope: public reports and report processing

## Current Heads

- `mes-adresses`: `us-port` at `49e7cea0`
- `mes-adresses-api`: `us-port` at `f56f934`
- `api-depot`: `us-port` at `7538240`

## Done

- US terminology cleanup is substantially improved in the frontend.
- Fowler, CA BAL loads in production.
- BAL map centering and jurisdiction boundary behavior were improved.
- `mes-adresses-api` includes count aliases needed by the US frontend.
- `api-depot` is configured with the US validation profile.
- `api-depot` now accepts US 5-digit county FIPS and 7-digit place FIPS in its local middleware/query validation path.
- `api-depot` US route validation fix is deployed successfully to Railway production.
- Reports pages no longer hard-crash when the reports API is unavailable.
- Railway production frontend now has `NEXT_PUBLIC_API_SIGNALEMENT` set.
- Reports are feature-gated for Phase 1 via `NEXT_PUBLIC_REPORTS_ENABLED`.
- Reports feature gate was deployed to production in `mes-adresses` commit `03d5d914`.
- Production smoke check confirmed the Reports tab is hidden and `/signalements` redirects back to the BAL.
- Safe local Porterville pilot import succeeded in the `mes-adresses-api` local database:
  - 50 Overture source rows
  - 5 streets
  - 35 unique addresses
  - 50 stored positions
- Safe local `api-depot` direct publish pilot succeeded for Porterville BAL `6f084c0c0a80f7d045c73c4d`:
  - 50 exported BAL rows
  - validator result `valid=true` under US profile
  - current published revision created for jurisdiction `0658240`
  - BAL file stored in local `api_depot.files.content`
- Safe production Overture import pilot succeeded for Bradbury city, CA (`0607946`):
  - 353 Overture addresses imported
  - 38 streets created
  - new BAL `69a51aacbfef8330dd45504d`
  - Overture stats confirm 100% GERS coverage for the imported BAL
- Fresno County authorization email allowlist was extended in `mes-adresses-api` and deployed:
  - added `rylopez@fresnocountyca.gov`
  - added `gisfresno@fresnocountyca.gov`
  - deployed in `mes-adresses-api` commit `d7eda25`
- Safe production Fresno County BAL created for the real authorization/publish smoke test:
  - county FIPS `06019`
  - BAL `69a63d42f7640a532120ab9f`
  - 80 Overture addresses imported across 5 streets
  - authorization `69a63d54f7640a532120ac45` created
  - PIN email sent to `rylopez@fresnocountyca.gov`
- Completed a real production authorization + publish/sync smoke test on Fresno County BAL `69a63d42f7640a532120ab9f`:
  - authorization validated successfully
  - publish endpoint returned `200`
  - BAL status moved to `published` with sync status `synced`
  - `lastUploadedRevisionId=69a8eafbbdb0f78f0a7ad66c`
  - `api-depot` current revision for `06019` matches `69a8eafbbdb0f78f0a7ad66c`
- Added a production SMTP guard in `mes-adresses-api` so PIN requests fail clearly when SMTP is not configured:
  - `POST /habilitation/email/send-pin-code` now returns `503` with a clear message instead of false-positive `200` when `SMTP_HOST` is missing in production.
  - guard verified on disposable Fresno County BAL `69a8ef1952543059bea756a9`.
- Recovered from a temporary `mes-adresses-api` production outage caused by an intermediate dependency-injection regression during the SMTP-guard rollout.
- Added Resend HTTP API fallback for PIN delivery in `mes-adresses-api` (deploy `2808b218-de17-4d45-ace8-bf06672a7aef`, status `SUCCESS`):
  - if SMTP is configured, uses existing SMTP mailer path
  - if SMTP is not configured and `RESEND_API_KEY` is set, uses `https://api.resend.com/emails`
  - if neither SMTP nor Resend is configured in production, returns `503`
- Generalized the Resend HTTPS fallback across all transactional emails in `mes-adresses-api`:
  - BAL creation
  - collaborator invites
  - recovery emails
  - token renewal
  - publication notifications
  - authorization PIN delivery
  - all production email-required flows now fail clearly with `503` if neither SMTP nor Resend is configured
- Replaced the legacy French publication-conflict image in `mes-adresses` with a US LAB/National Address Platform diagram and verified the updated modal live in production on March 13, 2026.
- Exact local browser verification of the updated `/new` and BAL recovery flows is now complete.
- The shared jurisdiction selector now supports `/new` deep-link prefill via `state`, `county`, and `place`, preserves selection on revisit/back-navigation, and shows clearer county-wide vs city/township summaries in both create and recovery flows.
- Recovery launched from the existing-draft warning in `/new` now carries the already selected jurisdiction into the recovery modal instead of forcing the user to reselect it.
- The force-publication conflict diagram now uses cleaner connector geometry and a clearer replacement marker in the publish flow.
- The "already published LAB" guidance now more clearly explains when to continue with the published LAB versus replacing it.
- BAL help/tutorial copy now matches the structured `state -> county -> city/place` selector and the county-wide path in the US port.
- The replaced-sync status message now uses the US support address and clearer takeover guidance.
- Publication help and the BAL publication goal now use the same US conflict/takeover guidance as the rest of the publish flow.
- BAL recovery now reuses the current jurisdiction from read-only and locked BAL-page actions instead of asking the user to reselect it.
- Read-only BAL recovery actions now use consistent "Recover admin access" wording across banners, inline alerts, and locked action buttons.

## Next

- Confirm external inbox receipt for the Resend-backed BAL creation email if we want the same human-level confirmation we now have for the Fresno County PIN flow.

## Blocked

- Reports are not Phase 1 ready.
- Reports depend on an external signalement service and a backend secret model.
- `mes-adresses-api` likely still needs `API_SIGNALEMENT_CLIENT_SECRET` if reports are brought back into scope.
- The full local `api-depot` HTTP publish path is still not fully signed off, but local US-mode no longer requires placeholder S3 env values to fall back to database file storage.
- Railway service-level egress check from `mes-adresses-api` confirms `smtp.resend.com:465` and `:587` time out while HTTPS (`api.resend.com:443`) is reachable. This means Railway email delivery for the US port should use the Resend HTTP API path rather than SMTP unless the plan/network changes.

## Phase 1 Checklist

### Scope

- [x] Reports are hidden or clearly deferred in production
- [x] Phase 1 launch scope is documented as authoring, certification, publication

### Frontend

- [x] BAL page loads for a US jurisdiction
- [x] Fowler map centers on the intended area
- [x] Streets workflow verified end-to-end
- [x] Place names workflow verified end-to-end
- [x] Address edit workflow verified end-to-end
- [x] Mobile/responsive check completed on core authoring screens
- [x] Remaining French admin/publication terms cleaned up

### Auth

- [x] Admin access recovery UI path tested in production
- [x] Authenticated admin edit flow tested in production
- [x] Read-only behavior confirmed for non-admin users

### Publication

- [x] Draft BAL can be published in production
- [x] Post-publication sync state updates correctly
- [x] Published BAL remains stable after reload

### API

- [x] BAL fetch works
- [x] Streets fetch works
- [x] Place names fetch works
- [x] Jurisdiction contour fetch works
- [x] Publication endpoints verified in production
- [x] Certification workflow verified in production

### Import and Validation

- [x] Realistic US dataset imported successfully in local `mes-adresses-api`
- [x] Realistic US dataset imported successfully in production `mes-adresses-api`
- [x] Validation output is understandable for US users
- [x] Known French-only validator errors for US jurisdiction codes have a local code fix
- [x] No blocking US validation mismatches remain in the local direct publish pilot

### Ops

- [x] Railway deploy state confirmed for all three services
- [x] `api-depot` Railway deploy state confirmed after US validation fix
- [x] `api-depot` health/readiness checks confirmed during release pass
- [x] No repeated production 500s during smoke test
- [x] Public domains stable during release pass

## Phase 2

- US-native reports service
- Public report submission flow
- Admin report inbox and triage
- Report resolution workflow
- Audit trail and notifications

## Working Rules

- Update this file at the end of each work session.
- Keep `Done`, `Next`, and `Blocked` current.
- Only treat Phase 1 as release-ready when all launch-critical checkboxes are complete.

## Session Notes

### April 12, 2026

- Extended jurisdiction-prefilled recovery beyond `/new` into BAL read-only flows:
  - read-only warning, BAL home read-only recovery, and locked street/number/place-name actions now all use `openRecovery({ commune })`
  - BAL recovery still opens without a prefill from the home card/help CTA where no current jurisdiction is in context
  - removed the remaining direct component-level `setIsRecoveryDisplayed(true)` calls outside the recovery context itself
- Standardized the recovery CTA wording across BAL read-only surfaces:
  - fixed bottom warning, inline read-only alert, and lock-button tooltip now consistently refer to "Recover admin access"
  - read-only copy now explains more directly that the BAL is read-only because the user is not signed in as an administrator

### April 11, 2026

- Refined the force-publication conflict modal in `mes-adresses`:
  - adjusted the replacement diagram so the active green path lands cleanly on the National Address Platform
  - replaced the floating red `x` with a more deliberate replacement marker on the superseded LAB path
- Clarified the alternative-to-replacement messaging for already published LABs:
  - `mes-adresses`-managed published LABs now explicitly recommend continuing from the published LAB when appropriate
  - API Depot and harvested-source warnings now explain replacement/contact tradeoffs in more direct US wording
- Updated the BAL help/tutorial layer to match the structured selector:
  - create/import help now instructs users to choose state, county, and city/township or county-wide scope
  - the "I can't find my jurisdiction" help now mentions the county-wide option for unincorporated areas
  - the recovery helper CTA now reads more clearly as an access-recovery action
- Updated the live replaced-sync banner copy:
  - conflict guidance now refers to the published LAB for the jurisdiction
  - support contact now points to `support@nap.us.gov`
- Aligned remaining publication-conflict wording with the same US guidance:
  - the BAL publication goal now explains that a different LAB is currently published for the jurisdiction
  - the publication help tab now explains when to continue from the current published LAB versus using Force publication to take over

### April 4, 2026

- Fixed the local `mes-adresses` dev-server startup bottleneck enough to complete the previously blocked browser pass:
  - `mes-adresses/next.config.ts` now keeps `reactCompiler` enabled in production but disables it in local dev
  - `mes-adresses/next.config.ts` now enables `experimental.optimizePackageImports` for `evergreen-ui`
  - cold local startup improved from a multi-minute stall to `Ready in 8.6s`
- Reduced the `/new` route compile path so the structured selector is locally usable:
  - `mes-adresses/src/components/new/index.tsx` now lazy-loads the step components with `next/dynamic`
  - this removed step 2's CSV validator bundle from the initial `/new` critical path
  - local `/new` responses dropped to sub-second range after the route warmed
- Completed an exact local browser pass using headless Chrome DevTools Protocol after the Playwright MCP path hit a root-filesystem cache-dir issue in this Codex environment:
  - `/new` renders the new `state -> county -> city/place` selector with the expected labels
  - selecting California loads county options locally
  - selecting Fresno County exposes the county-wide option plus city options and shows the `Create a new Local Address Base` CTA
  - BAL recovery opens from the home screen
  - the recovery modal renders the same selector and loads California county options locally
  - selecting Fresno County exposes the county-wide option plus city options
  - recovery currently shows the expected fallback warning when no jurisdiction email preview is available from the local directory lookup, while still leaving `Receive the email` available
- Polished the structured selector follow-through in `mes-adresses`:
  - `/new` now accepts `state`, `county`, and `place` query params in addition to the legacy `commune` param
  - step 1 now preserves the selected jurisdiction when returning from step 2 instead of clearing or auto-bouncing forward again
  - the shared selector now shows a clearer selected-jurisdiction summary with selection type, path, and county-wide vs place-specific scope text
  - county-wide recovery selection now keeps its summary/fallback state instead of clearing the selected commune when the county option is re-selected in the third dropdown
- Verified the selector polish locally in a live browser on `127.0.0.1:3001`:
  - `/new?state=06&county=06019&place=0614218` reopened Clovis city with the expected California -> Fresno County -> Clovis city summary
  - the auto-advanced Clovis deep link returned cleanly to step 1 via `Previous` and kept the same state/county/place selection
  - `/new?state=06&county=06019` reopened the Fresno County county-wide selection with the expected summary
  - BAL recovery now renders the county-wide summary and backend-directory fallback message after selecting Fresno County county-wide
- Reduced repeated jurisdiction re-selection when recovering an existing unpublished LAB from `/new`:
  - `BALRecoveryContext` now supports opening the recovery modal with a preselected jurisdiction
  - the existing-draft warning on `/new` now opens recovery already scoped to the selected jurisdiction
  - `RecoverBALCommune` now hydrates its selector/email-preview state from that prefilled jurisdiction when no BAL is already open
  - browser verification on `127.0.0.1:3001` confirmed the exact path for Clovis city: existing-draft alert -> `Recover a LAB with an email` -> recovery modal opened with California / Fresno County / Clovis city already selected and the selected-jurisdiction summary visible
  - disposable local Clovis demo/draft BALs used for that verification were deleted afterward, returning local search count for `0614218` to zero

### April 2, 2026

- Reused the new structured jurisdiction selector in `mes-adresses` BAL recovery:
  - recovery now uses the same state -> county -> city/place picker as the create-BAL flow
  - removed the last frontend usages of the legacy free-text commune search components
  - kept the county-wide recovery path intact by preserving the county option for unincorporated-area jurisdictions
- Hardened the new structured selector and recovery UX in `mes-adresses`:
  - selector list endpoints now surface real fetch failures instead of silently collapsing to empty lists
  - selector UI now shows retryable load errors and an explicit no-places-found message when only the county-wide option is available
  - BAL recovery now warns when it cannot preview a jurisdiction email address but still lets the backend recovery lookup continue
- Browser-pass follow-up:
  - Docker-backed Postgres/Redis started successfully and a trivial local Python server bound ports normally
  - initial local browser verification was blocked at this point because both `mes-adresses` and `mes-adresses-api` still appeared to idle before binding ports
- Machine/tooling follow-up:
  - switched macOS developer tools from full Xcode to Command Line Tools with `xcode-select`
  - nested git repos now work normally again
  - local `jest` still appears to spend excessive time crawling files in this environment, so automated verification remains a separate follow-up task

### March 27, 2026

- Added an explicit local US-mode startup guard in `api-depot` file storage:
  - when `API_DEPOT_VALIDATION_PROFILE=us`
  - and `NODE_ENV` is not `production`
  - and required `S3_*` env vars are missing
  - `api-depot` now skips S3 client usage for new BAL file uploads and relies on the existing database fallback path instead of requiring dummy S3 config
- Updated the local developer guidance:
  - `api-depot/.env.sample` now says local US-mode can leave `S3_*` empty
  - `api-depot/README.md` now documents the DB fallback behavior for local US-mode
- Added a repo-level `.nvmrc` pinning Node `22` for the whole workspace
- Added focused file-storage tests in `api-depot` for:
  - the local US-mode S3 guard path
  - the database fallback path in `FileService`
- Replaced the create-BAL step-1 free-text jurisdiction search with a structured state -> county -> city/place selector in `mes-adresses`:
  - added new `mes-adresses-api` list endpoints for states, counties by state, and places by county
  - selector defaults to the county option for county-wide / unincorporated-area LABs
  - `findCommune` / jurisdiction payloads now include `stateFips` and `countyFips` so deep links can prefill the selector
- Added focused `mes-adresses-api` unit coverage for the new selector data paths in `commune.service.spec.ts`
- Verification caveat on this machine:
  - Node `22` is now available locally and `.nvmrc` pins the workspace accordingly
  - in this Codex shell, commands still need `source ~/.nvm/nvm.sh && nvm use 22` before running Node-based tooling
  - local `jest` / `nest build` / `tsc` did not complete cleanly in this environment even after switching to Node `22`, so a clean automated local pass is still pending here

### March 21, 2026

- Confirmed current production Railway deploy state for all three services:
  - `mes-adresses` latest deploy `5466f56e-3e67-41f6-b13f-957dbdf9aa95` -> `SUCCESS`
  - `mes-adresses-api` latest deploy `418d2128-9dc9-4894-bfe3-667d90a1648d` -> `SUCCESS`
  - `api-depot` latest deploy `04261ecd-04c1-47fb-9567-95f3b8b3faae` -> `SUCCESS`
- Confirmed public roots stayed healthy during the release pass:
  - `https://mes-adresses-production.up.railway.app` -> `200`
  - `https://mes-adresses-api-production.up.railway.app` -> `200`
  - `https://api-depot-production.up.railway.app` -> `200`
- Verified authenticated admin edit flow on disposable Fresno County BAL `69b44613edb7d645fb92f91e` using the saved admin token URL:
  - reopened address `100 a`
  - saved an edit successfully and received `The number has been updated`
  - reopened the same address and confirmed the edited state was still present in the admin UI
- Verified certification workflow in production on the same disposable BAL:
  - used `Certify and save` on number `100 a`
  - received `The number has been updated`
  - the uncertified-address filter no longer returned any rows for `Smoke Test Avenue`
  - direct API check now returns `certifie: true` for numero `69b446a6edb7d645fb92f920`
- Verified published BAL stability after reload on published Fresno County BAL `69a63d42f7640a532120ab9f`:
  - initial public load succeeded in read-only mode
  - full reload succeeded
  - counts remained stable at `5 streets`, `0 place name`, `80 addresses`
- Completed a mobile-width smoke check at `390x844` on the disposable draft BAL:
  - jurisdiction screen loaded
  - streets list loaded
  - address list for `Smoke Test Avenue` loaded
  - place names list loaded
- During this March 21 release pass, no `500` responses were observed from the frontend, API, or `api-depot` public endpoints and no application API requests returned `500` in the browser network log.
- Residual non-blocking issues still observed during the browser pass:
  - repeated minified frontend console errors from `/_next/static/chunks/d718153449c72f1e.js`
  - repeated `400` responses from `api.panoramax.xyz` vector-tile requests
  - expected `204` responses for empty tile requests
  - `comment` remains filtered from unauthenticated public numero API responses, so public API checks do not expose the confidential note saved in the admin UI
- Documented the Phase 1 launch scope explicitly in `README.md`:
  - Phase 1 production scope is US authoring, certification, and publication
  - public reports and report processing remain out of scope
- Finished the remaining French-to-US admin/publication wording cleanup in `mes-adresses` and deployed it to production:
  - updated certification help copy and guide links
  - updated publication help/tutorial buttons and conflict wording
  - updated ProConnect wording in the authorization strategy selector
  - updated welcome/onboarding publication copy and `jurisdiction logo` alt text
  - frontend deploys `75d4ff7d-e626-46d6-8e92-4be2d80f6294` and `acc468c3-ddb1-4138-bf24-46c9556f7301` reached `SUCCESS`
- Re-verified the live frontend after the wording deploys on disposable Fresno County BAL `69b44613edb7d645fb92f91e`:
  - welcome modal now says `Start by publishing`
  - publish conflict flow shows `Publish` and `Force publication`
  - the BAL used for verification was already in the accepted-authorization state, so live verification re-entered the conflict modal directly rather than the earlier ProConnect choice screen
- Re-confirmed that the earlier Fresno County import already satisfies the real end-to-end US import-through-`api-depot` proof without another production mutation:
  - `GET /v2/overture/stats/69a63d42f7640a532120ab9f` -> `{"totalAddresses":80,"withGersId":80,"withoutGersId":0,"coveragePercent":100}`
  - `GET /communes/06019/current-revision` -> current revision `69a8eafbbdb0f78f0a7ad66c`
  - `context.extras.balId` on that revision still matches imported Fresno County BAL `69a63d42f7640a532120ab9f`
- Documented the Phase 1 production env vars and rollout assumptions in `docs/RAILWAY_DEPLOYMENT.md` and aligned the repo env samples:
  - added a focused `Phase 1 US launch profile` section with launch-critical vars and rollout assumptions for frontend, API, and `api-depot`
  - added `NEXT_PUBLIC_REPORTS_ENABLED=false` guidance to `mes-adresses/.env.sample`
  - clarified `API_DEPOT_URL` / `API_DEPOT_CLIENT_SECRET` and reports-out-of-scope signalement expectations in `mes-adresses-api/.env.sample`
  - changed `api-depot/.env.sample` to use `API_DEPOT_VALIDATION_PROFILE=us`

### March 13, 2026

- Added `scripts/railway-configure-email.mjs` to upsert `RESEND_API_KEY`, `RESEND_FROM`, and optional `SMTP_BCC` on the linked `mes-adresses-api` Railway service and optionally trigger a deploy.
- Documented the helper script and a safe `DRY_RUN=1` path in the Railway/email setup docs so the remaining production email rollout step is one command after Railway re-authentication.
- Re-authenticated Railway locally, set production `RESEND_API_KEY`, `RESEND_FROM`, and `SMTP_BCC` on `mes-adresses-api`, and confirmed the resulting Railway deploy completed successfully.
- Confirmed the public API remained healthy after the deploy (`GET /` -> `200`).
- Production smoke test reached Resend successfully, but live BAL creation still failed because Resend returned `403` for the unverified `ryanlopez.tech` sender domain.
- Removed the live `RESEND_API_KEY` again and redeployed `mes-adresses-api` so production reverted to the clearer fallback behavior (`POST /v2/bases-locales` now returns `503 Email delivery is not configured`) while domain verification is pending.
- Re-enabled the live `RESEND_API_KEY` after `ryanlopez.tech` was verified in Resend, waited for Railway deploy `418d2128-9dc9-4894-bfe3-667d90a1648d` to reach `SUCCESS`, and confirmed the public API stayed healthy.
- Completed a fresh production smoke test with Resend enabled:
  - created BAL `69b44543edb7d645fb92f91c` for Fresno County (`06019`) with `POST /v2/bases-locales` -> `200`
  - created authorization `69b44543edb7d645fb92f91d` with `POST /v2/bases-locales/:id/habilitation` -> `201`
  - sent a real PIN email to `rylopez@fresnocountyca.gov` with `POST /v2/bases-locales/:id/habilitation/email/send-pin-code` -> `200`
  - Railway runtime logs report `PIN code sent` with no Resend error after the successful deploy
- Confirmed human inbox receipt of the Fresno County verification email, including the expected `noreply@ryanlopez.tech` sender and a valid six-digit code, so the production PIN email path is now verified end-to-end.
- Ran a live production frontend smoke test on disposable Fresno County BAL `69b44613edb7d645fb92f91e`:
  - BAL page loaded successfully in the editor
  - created street `Smoke Test Avenue`
  - created address `100` and then updated it to `100 a`
  - created place name `Smoke Landmark`
  - reached the production publication conflict modal and confirmed the live app correctly warns that force publication would replace the currently published Fresno County BAL `69a63d42f7640a532120ab9f`
- Did not complete force-publication from the UI because the disposable smoke-test BAL contains new test data and would overwrite the real published Fresno County dataset if forced.
- The replace-publication dialog still contains a French legacy conflict diagram image; replaced that static image in the frontend source with a US-port React diagram using LAB/National Address Platform terminology.
- Deployed the `mes-adresses` frontend with the new US conflict diagram and verified it live in production on BAL `69b44613edb7d645fb92f91e`; the publish modal now shows:
  - `Current situation`
  - `After force publication`
  - `New LAB`
  - `Current LAB`
  - `National Address Platform`
- Did not click `Force publication` during that verification pass, so the real published Fresno County BAL `69a63d42f7640a532120ab9f` remains untouched.

### March 6, 2026

- Reworked `mes-adresses-api` email delivery so every transactional email path uses the same transport selection:
  - SMTP when `SMTP_HOST` is configured
  - Resend HTTPS when `RESEND_API_KEY` is configured and SMTP is not
  - local stream transport only outside production when neither is configured
- Added a shared transactional email service and switched BAL creation, collaborator invite, recovery, token renewal, publication, and authorization PIN flows to use it.
- Added focused automated coverage for the SMTP, Resend, dev fallback, and production `503` cases.
- Updated the Railway deployment notes to make Resend HTTPS the recommended production setup for the US port.

### March 1, 2026

- Confirmed reports are not required for Phase 1 launch.
- Confirmed reports are currently admin-only and publication-gated.
- Confirmed Fowler currently has zero reports in the external signalement service.
- Confirmed production frontend has the reports API URL configured.
- Identified likely missing backend report secret if reports are later enabled.
- Added a frontend reports feature flag for the Phase 1 rollout.
- Deployed the reports feature gate to production and verified the fallback behavior in the browser.
- Confirmed read-only behavior in production for unauthenticated users.
- Confirmed the production recovery modal opens and renders its email form once the BAL page has finished loading. No frontend patch was required for that flow.
- Built a realistic local US BAL CSV sample from Overture Porterville records and confirmed the key US coordinate mismatch path: `@etalab/project-legal` returns `null` for the sample coordinates, which aligns with `row.longlat_invalides` being downgraded by the `api-depot` US validation profile.
- Started the local Docker-backed services successfully.
- Found a local schema gap in `mes-adresses-api`: the database still had `commune varchar(5)`, which blocks 7-digit place FIPS imports until the widen migration is applied.
- Applied the local schema widening needed for the Porterville pilot and confirmed a small direct pilot import into the local `mes-adresses-api` database.
- Found the local `api-depot` database was in an inconsistent state: tables existed but migrations had not been recorded. Resetting the local `api_depot` database and rerunning migrations fixed that local bootstrap issue.
- Seeded a minimal local `api-depot` internal client matching `API_DEPOT_CLIENT_SECRET=local-nap-client-token` so local publish requests have a valid client token.
- Patched `api-depot` locally so US validation/profile routing no longer hard-rejects 5-digit county FIPS or 7-digit place FIPS at the middleware/query layer.
- Verified that the raw BAL validator still flags US jurisdiction codes as invalid (`commune_insee.commune_invalide`, `cle_interop.commune_invalide`) and patched the local US validation profile so those expected French-only errors are downgraded instead of blocking publication.
- A minimal one-row Porterville BAL sample now evaluates as valid after the US-profile downgrade rules are applied.
- Committed and pushed the `api-depot` US validation fix set as `7f90261` (`fix(us): accept US jurisdiction codes in depot validation`).
- Added a Railway build-cache workaround in `api-depot` (`7538240`, `build(railway): clear corrupted yarn cache for api-depot`) after the first production deploy failed due corrupted Yarn cache artifacts in Railway’s build cache.
- Completed a direct local `api-depot` publish pilot for Porterville using the imported BAL:
  - created a published current revision for `0658240`
  - stored the BAL CSV file content locally
  - confirmed the patched US profile downgrades the expected French-only validator errors and allows publication
- Confirmed Railway production deployment `04261ecd-04c1-47fb-9567-95f3b8b3faae` succeeded after the cache workaround.
- Confirmed production `api-depot` now accepts US jurisdiction codes at public routes:
  - `GET /communes/0625436/revisions` -> `200 []`
  - `GET /communes/0658240/revisions` -> `200 []`
- Ran a safe production Overture import pilot for Bradbury city, CA (`0607946`) using Overture locality-boundary filtering:
  - 353 addresses fetched from Overture
  - imported BAL `69a51aacbfef8330dd45504d`
  - 38 streets created, 353 addresses created, 353 GERS IDs linked, 0 skipped
  - editor URL responds with `200`
  - `GET /v2/overture/stats/69a51aacbfef8330dd45504d` reports 100% GERS coverage
- Added Fresno County production authorization emails in `mes-adresses-api/us-jurisdiction-emails.json` and deployed `mes-adresses-api` commit `d7eda25` successfully to Railway production.
- Created a small Fresno County production BAL for the real publish smoke test (`69a63d42f7640a532120ab9f`) using a bounded Overture import:
  - bbox `(-119.78, 36.95, -119.64, 37.05)`
  - 80 addresses, 5 streets
  - created pending authorization `69a63d54f7640a532120ac45`
  - successfully sent a PIN email to `rylopez@fresnocountyca.gov`
- Identified why PIN emails were not received in production: `SMTP_HOST` is not configured on `mes-adresses-api`, so mailer uses stream transport (no external email delivery) even though API returns success.
- Completed the Fresno County publish smoke test by retrieving the generated PIN via a secure in-service query and validating authorization:
  - `POST /v2/bases-locales/69a63d42f7640a532120ab9f/habilitation/email/validate-pin-code` -> `200`
  - `POST /v2/bases-locales/69a63d42f7640a532120ab9f/sync/exec` -> `200`
  - resulting revision `69a8eafbbdb0f78f0a7ad66c` is current in `api-depot` for `06019`
- The remaining Phase 1 gaps are now primarily frontend workflow verification and production SMTP/email delivery configuration.
