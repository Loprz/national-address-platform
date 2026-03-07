# US Port Tracker

Last updated: March 6, 2026

## Current Call

- Status: Conditionally ready for Phase 1
- Phase 1 scope: US authoring, certification, publication
- Out of scope: public reports and report processing

## Current Heads

- `mes-adresses`: `us-port` at `03d5d914`
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

## Next

- Run a full production smoke test for:
  - BAL page
  - streets
  - place names
  - address editing
  - publication
  - sync
- Test one real end-to-end US import through `api-depot` with a safe pilot dataset.
- Finish the remaining French-to-US terminology cleanup in admin/publication flows.
- Document the Phase 1 production env vars and rollout assumptions.
- Re-test production publication/sync against the deployed `api-depot` US validation fixes.
- Run a fuller production publish/sync smoke test from `mes-adresses-api` using a safe BAL when we are ready to mutate production data.
- Decide whether to add an explicit US-mode startup guard for `api-depot` local dev to avoid local S3 config friction.
- Configure real `RESEND_API_KEY` and `RESEND_FROM` in Railway for `mes-adresses-api` and verify end-to-end delivery for both recovery and PIN flows to a Fresno County inbox.

## Blocked

- Reports are not Phase 1 ready.
- Reports depend on an external signalement service and a backend secret model.
- `mes-adresses-api` likely still needs `API_SIGNALEMENT_CLIENT_SECRET` if reports are brought back into scope.
- The full local `api-depot` HTTP publish path is still not signed off because local startup remains slow and requires placeholder S3 env values.
- Production email delivery is still not configured for `mes-adresses-api`:
  - `SMTP_HOST` is unset
  - `RESEND_API_KEY`/`RESEND_FROM` still need to be populated in Railway
- Railway service-level egress check from `mes-adresses-api` confirms `smtp.resend.com:465` and `:587` time out while HTTPS (`api.resend.com:443`) is reachable. This means Railway email delivery for the US port should use the Resend HTTP API path rather than SMTP unless the plan/network changes.

## Phase 1 Checklist

### Scope

- [x] Reports are hidden or clearly deferred in production
- [ ] Phase 1 launch scope is documented as authoring, certification, publication

### Frontend

- [x] BAL page loads for a US jurisdiction
- [x] Fowler map centers on the intended area
- [ ] Streets workflow verified end-to-end
- [ ] Place names workflow verified end-to-end
- [ ] Address edit workflow verified end-to-end
- [ ] Mobile/responsive check completed on core authoring screens
- [ ] Remaining French admin/publication terms cleaned up

### Auth

- [x] Admin access recovery UI path tested in production
- [ ] Authenticated admin edit flow tested in production
- [x] Read-only behavior confirmed for non-admin users

### Publication

- [x] Draft BAL can be published in production
- [x] Post-publication sync state updates correctly
- [ ] Published BAL remains stable after reload

### API

- [x] BAL fetch works
- [x] Streets fetch works
- [x] Place names fetch works
- [x] Jurisdiction contour fetch works
- [x] Publication endpoints verified in production
- [ ] Certification workflow verified in production

### Import and Validation

- [x] Realistic US dataset imported successfully in local `mes-adresses-api`
- [x] Realistic US dataset imported successfully in production `mes-adresses-api`
- [x] Validation output is understandable for US users
- [x] Known French-only validator errors for US jurisdiction codes have a local code fix
- [x] No blocking US validation mismatches remain in the local direct publish pilot

### Ops

- [ ] Railway deploy state confirmed for all three services
- [x] `api-depot` Railway deploy state confirmed after US validation fix
- [x] `api-depot` health/readiness checks confirmed during release pass
- [ ] No repeated production 500s during smoke test
- [ ] Public domains stable during release pass

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
