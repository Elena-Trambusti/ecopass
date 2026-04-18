# Deploy EcoPass su Fly.io (da zero)

Questa guida assume che tu abbia già un account Shopify Partners e l'app EcoPass creata nel Partner Dashboard.

## 0) Prerequisiti locali

- Installa Fly CLI: [https://fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)
- Login:

```bash
fly auth login
```

## 1) Database Postgres su Fly

Crea un database gestito e ottieni `DATABASE_URL` tramite attach alla app (consigliato).

Esempio (nomi adattabili):

```bash
fly postgres create --name ecopass-db --region ams --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
```

Dopo aver creato l'app Fly (step 2), attacca il DB:

```bash
fly postgres attach --app ecopass-shopify ecopass-db
```

Fly inietta automaticamente `DATABASE_URL` nei secrets dell'app.

## 2) Crea l'app Fly dal Dockerfile del repo

Dalla root del progetto:

```bash
fly launch --no-deploy --copy-config --name ecopass-shopify --region ams
```

Se il nome `ecopass-shopify` e' occupato, cambialo sia nel comando sia in `fly.toml` (`app = "..."`).

## 3) Imposta i secrets Shopify

Sostituisci i valori reali:

```bash
fly secrets set --app ecopass-shopify \
  SHOPIFY_API_KEY="..." \
  SHOPIFY_API_SECRET="..." \
  SHOPIFY_APP_URL="https://ecopass-shopify.fly.dev" \
  SCOPES="read_products,write_products"
```

Note:

- `SHOPIFY_APP_URL` deve essere l'URL pubblico HTTPS della tua app Fly (root), senza slash finale.
- `DATABASE_URL` di solito e' gia' presente dopo `fly postgres attach`.

## 4) Deploy

```bash
fly deploy --app ecopass-shopify
```

Il container esegue `prisma migrate deploy` all'avvio prima di `npm run start`.

## 5) Aggiorna Shopify (Partner Dashboard)

Nel Partner Dashboard, aggiorna:

- App URL (root HTTPS Fly)
- Allowed redirection URL(s) (OAuth callback)

Poi reinstalla l'app sul dev store se necessario.

## 6) Verifica

- Apri `https://<tuo-app>.fly.dev/healthz` e verifica `ok`
- Apri l'app embedded da Shopify Admin
