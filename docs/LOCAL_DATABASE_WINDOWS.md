# Database locale su Windows (senza Docker)

Se vedi errori come:

- `docker : Termine 'docker' non riconosciuto...`
- `P1001: Can't reach database server at localhost:5432`

significa che **non hai un server Postgres in esecuzione** sulla macchina, oppure Docker non e' installato.

Hai 3 opzioni valide (scegline una):

## Opzione A (consigliata se "parti da zero"): Postgres hosted (Neon)

1. Crea un progetto Postgres su Neon.
2. Copia la connection string `postgresql://...`
3. Imposta nel tuo `.env`:

`DATABASE_URL="postgresql://..."`

4. Esegui:

```powershell
cd C:\Users\Elena\Documents\Eco-Pass
npx prisma migrate dev
```

Vantaggi: niente installazioni locali, funziona subito.

## Opzione B: Docker Desktop + `docker compose`

1. Installa Docker Desktop per Windows.
2. Avvia Docker Desktop.
3. Esegui:

```powershell
cd C:\Users\Elena\Documents\Eco-Pass
docker compose up -d
npx prisma migrate dev
```

## Opzione C: Installazione nativa PostgreSQL (EDB installer)

1. Scarica installer PostgreSQL per Windows dal sito ufficiale EDB.
2. Durante setup, crea utente/password e database (es. `ecopass`).
3. Aggiorna `DATABASE_URL` nel `.env` di conseguenza.
4. Esegui `npx prisma migrate dev`.
