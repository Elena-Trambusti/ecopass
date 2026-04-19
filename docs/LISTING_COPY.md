# EcoPass App Store Listing Copy

## One-line value proposition

Show a clean Digital Product Passport badge on every product page with automatic sustainability metafields and merchant-friendly styling controls.

## Short description

EcoPass helps merchants publish product sustainability information in a modern badge format, directly in Shopify themes.

## Full description

EcoPass makes Digital Product Passport communication simple:

- Add the EcoPass Theme App Extension block to your product template.
- Configure badge style from the embedded admin.
- Use product metafields for Materials, Carbon footprint, and Recyclability.
- Keep data visible with intelligent fallback defaults.

EcoPass is designed for teams that want compliant-looking product transparency with minimal setup effort.

## Pricing

- Plan: EcoPass Pro
- EUR 14.99 per 30 days
- 7-day free trial
- Auto-renew until canceled in Shopify Admin

## Support

- Email: support@ecopass.app
- Response targets available in `SUPPORT.md`

## Assets Checklist

- App icon (1024x1024)
- 3-5 admin screenshots
- 2 storefront screenshots with badge visible
- Optional 30-60s demo video

## Partner Dashboard — URL pubblici (incolla così)

Le pagine legali sono **bilingue (italiano + inglese)** sulla stessa URL.

- Privacy policy: https://elena-trambusti.github.io/ecopass-legal-pages/privacy.html
- Terms of service: https://elena-trambusti.github.io/ecopass-legal-pages/terms.html
- Support / contact: https://elena-trambusti.github.io/ecopass-legal-pages/support.html
- Codice sorgente (repository): https://github.com/Elena-Trambusti/ecopass

**Cosa devi fare solo tu nel Partner Dashboard** (login, screenshot, invio review): vedi `docs/SOLO_TU_SHOPIFY.md`.

## Partner Dashboard — valori tecnici (allineati al codice)

- **App name (display):** EcoPass
- **App URL (produzione):** `https://ecopass-shopify.fly.dev`
- **Allowed redirection URL(s)** (devono combaciare con `shopify.app.toml` e con l’app in Partners):
  - `https://ecopass-shopify.fly.dev/auth/callback`
  - `https://ecopass-shopify.fly.dev/auth/shopify/callback`
  - `https://ecopass-shopify.fly.dev/api/auth/callback`
- **OAuth scopes richiesti:** `read_products`, `write_products` (vedi `shopify.app.toml` / variabile `SCOPES` in produzione).
- **Billing:** piano Shopify **EcoPass Pro** — EUR **14.99** ogni **30** giorni, **7** giorni di prova (`ECOPASS_BILLING_*` in `app/shopify.server.ts`).
- **Distribuzione app:** App Store (`AppDistribution.AppStore` nel codice).

### Categorie e parole chiave suggerite (listing)

Primary category: **Store design** (Theme App Extension + blocco tema).

Secondary category: **Selling products** (informazioni prodotto / trasparenza).

Search keywords (inglese, separate come richiesto dal form):

`sustainability, digital product passport, product badge, transparency, EU compliance, theme extension, metafields`

### Dichiarazioni su dati personali / privacy (testo base per i questionari)

Usa formulazioni coerenti con `PRIVACY.md`. EcoPass:

- Memorizza **identificativo negozio (dominio)** e **impostazioni badge** nel database dell’app (modelli `Shop` / `Settings`).
- Usa **sessioni OAuth Shopify** (token di accesso e, se forniti da Shopify, dati staff come email/nome nel modello Session) come richiesto dal login embedded.
- Crea/usa **metafield prodotto e shop** tramite Admin API per materiali, impronta carbonio, riciclabilità e stato del badge (vedi `shopify.server.ts`).
- **Non vende** dati. Implementa webhook **APP_UNINSTALLED**, **CUSTOMERS_DATA_REQUEST**, **CUSTOMERS_REDACT**, **SHOP_REDACT** per conformità Shopify/GDPR.

Se il form chiede “customer personal data”: l’app non è un CRM; i contenuti mostrati nel badge dipendono dai **dati prodotto** che il merchant inserisce (metafield). Rispondere in modo prudente e allineato alla privacy policy pubblicata.

### Cosa deve fare solo tu nel browser (non automatizzabile)

1. Accedi a **[Shopify Partners](https://partners.shopify.com)** → **Apps** → **EcoPass**.
2. Completa **App listing** (testi sopra, URL legali, email supporto che controlli davvero).
3. Carica **icona 1024×1024** e **screenshot** (admin + storefront con badge).
4. Rispondi alle **domande compliance / privacy / categorie** usando le sezioni sopra.
5. Verifica che **URLs** dell’app e redirect in Partners coincidano con Fly e `shopify.app.toml`.
6. Quando tutto è verde: **Submit app for review** / **Distribution** sullo Shopify App Store (etichetta esatta dipende dalla UI).

Dopo eventuali modifiche a estensioni o URL: dalla cartella progetto eseguire `npx shopify app deploy` per pubblicare una nuova versione configurazione app.

## Verifica automatizzabile (fatto sul repo il 2026-04-19)

- `npm run typecheck`, `npm run build`, `npm run test`: **passati**.
- `flyctl deploy --remote-only` verso **`ecopass-shopify`**: **completato**; app su `https://ecopass-shopify.fly.dev`.

