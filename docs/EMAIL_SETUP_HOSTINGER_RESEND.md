# Hostinger + Resend + Railway Email Setup

This is the production email setup for the US port of the National Address Platform.

## Target configuration

- Domain DNS managed in Hostinger: `ryanlopez.tech`
- App sender: `noreply@ryanlopez.tech`
- Human inbox for testing/audit: `ryan@ryanlopez.tech`
- Outbound delivery provider: Resend HTTPS API
- Railway service: `mes-adresses-api`

Do not use SMTP on Railway unless Railway egress is later confirmed to allow it. The API already supports SMTP, but the current production path should use Resend over HTTPS.

## 1. Verify the sender domain in Resend

1. Sign in to Resend.
2. Go to the Domains page.
3. Add the domain `ryanlopez.tech`.
4. Choose `noreply@ryanlopez.tech` as the sender identity.
5. Copy the DNS records that Resend asks you to add.

Resend will typically require:

- one TXT record for domain verification
- one or more DKIM CNAME records
- an SPF include update for the root domain if not already present

## 2. Add the DNS records in Hostinger

1. Sign in to Hostinger.
2. Open the DNS zone for `ryanlopez.tech`.
3. Add the exact Resend records from step 1.
4. If Hostinger already has an SPF TXT record at the root (`@`), merge the Resend include into the existing SPF record instead of creating a second SPF record.

Example pattern only:

```txt
v=spf1 include:_spf.mail.hostinger.com include:spf.resend.com ~all
```

Do not copy that blindly. Use the exact provider values currently shown by Hostinger and Resend.

5. Wait until Resend marks the domain as verified.

## 3. Create the Resend API key

1. In Resend, create a production API key with send permissions.
2. Store it securely.
3. Use it only for `mes-adresses-api`.

## 4. Configure Railway

Set these variables on the `mes-adresses-api` service.

Required:

- `RESEND_API_KEY=<live resend api key>`
- `RESEND_FROM=noreply@ryanlopez.tech`

Recommended:

- `SMTP_BCC=ryan@ryanlopez.tech`

Leave unset:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`

The API now sends all transactional mail through the same transport selection logic:

- SMTP if `SMTP_HOST` is set
- otherwise Resend HTTPS if `RESEND_API_KEY` is set
- otherwise `503` in production for email-required flows

## 5. Smoke test

After the domain is verified and Railway variables are set:

1. Trigger BAL recovery email.
2. Trigger authorization PIN email.
3. Validate the PIN and publish/sync a safe BAL.
4. Optionally create a BAL or add a collaborator to verify the other templates.

## 6. Expected behavior

The following email flows should all work through Resend when `RESEND_API_KEY` is present:

- BAL creation
- collaborator invite
- recovery email
- token renewal
- publication notification
- authorization PIN delivery

If `RESEND_API_KEY` is removed in production and SMTP is still unset, these flows should fail with `503` instead of pretending email was delivered.
