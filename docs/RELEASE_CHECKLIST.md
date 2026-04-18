# EcoPass Release & Submission Checklist

**Ultima esecuzione automatizzata in locale (2026-04-19):** `typecheck`, `build`, `test` OK; deploy Fly `ecopass-shopify` OK. Restano le voci che richiedono il Partner Dashboard o giudizio umano (screenshot, email attiva, test manuali sugli store).

## 1) Security & Secrets

- [ ] `.env` is ignored by git.
- [ ] Secrets are not present in tracked files.
- [ ] Production secrets are stored in hosting secret manager.
- [ ] Shopify API secret rotated if previously exposed.

## 2) Shopify Configuration

- [ ] `shopify.app.toml` production URLs point to live HTTPS domain.
- [ ] Redirect URLs are updated for production.
- [ ] Required scopes are minimal and validated.

## 3) Compliance Webhooks

- [ ] `APP_UNINSTALLED` webhook tested.
- [ ] `CUSTOMERS_DATA_REQUEST` webhook tested.
- [ ] `CUSTOMERS_REDACT` webhook tested.
- [ ] `SHOP_REDACT` webhook tested.
- [ ] Privacy compliance URLs configured in app settings.

## 4) Billing

- [ ] EcoPass Pro plan and trial days verified.
- [ ] Billing approval flow verified on test store.
- [ ] Cancel/re-subscribe behavior verified.

## 5) Quality Gates

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `npm run test` passes.
- [ ] CI workflow passes on default branch.

## 6) App UX & Extension

- [ ] Admin settings save correctly.
- [ ] Theme app block renders in product template.
- [ ] Metafields display dynamic values.
- [ ] Fallback values show when fields are missing.

## 7) Legal & Listing

- [ ] Privacy policy published at public URL.
- [ ] Terms of service published at public URL.
- [ ] Support policy published at public URL.
- [ ] Listing copy finalized from `docs/LISTING_COPY.md`.
- [ ] Screenshots and media uploaded in Partner Dashboard.

## 8) Dry-run (End-to-End)

- [ ] Fresh install on clean dev store.
- [ ] Open embedded app and complete onboarding.
- [ ] Add extension block and verify storefront output.
- [ ] Uninstall app and verify cleanup behavior.
- [ ] Reinstall and verify app state recovery.

