# Deploy MultaCheck su Vercel

Setup one-time per pubblicare l'app online.

## Prerequisiti

- Account [Vercel](https://vercel.com) (Hobby gratuito è sufficiente — il piano Hobby supporta funzioni serverless fino a 60s, abbastanza per OCR + generazione ricorso)
- Account Supabase con il progetto MultaCheck già configurato
- API key Anthropic
- Sanity project ID + read token

## Step 1 — Importa il progetto

1. Vai su https://vercel.com/new
2. Importa il repo GitHub `marcocorsaro-sys/multachecker`
3. Nella schermata "Configure Project":
   - **Project name**: `multacheck` (o quello che preferisci)
   - **Framework Preset**: Next.js (auto-detect)
   - **Root Directory**: clicca **Edit** e seleziona `apps/web`
   - **Build/Install/Output commands**: NON toccarli — sono già configurati in `apps/web/vercel.json`

## Step 2 — Environment variables

Aggiungi queste env var nella sezione "Environment Variables" prima di cliccare Deploy.
Tutte vanno applicate a Production, Preview e Development.

```
NEXT_PUBLIC_SUPABASE_URL=https://kviwyswvmygxkngfssqz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<la-tua-anon-key>

NEXT_PUBLIC_SANITY_PROJECT_ID=9zy1q6a1
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=<il-tuo-read-token>
SANITY_REVALIDATE_SECRET=<un-segreto-a-tua-scelta>

ANTHROPIC_API_KEY=sk-ant-...

NEXT_PUBLIC_SITE_URL=https://multacheck.vercel.app
```

> **Nota**: dopo il primo deploy, Vercel ti darà un URL definitivo (tipo `multacheck-xyz.vercel.app`). Aggiorna `NEXT_PUBLIC_SITE_URL` con quel valore e re-deploy.

## Step 3 — Deploy

Clicca **Deploy**. Il primo build dura ~3-5 minuti perché installa l'intero monorepo.

Vercel eseguirà:
```sh
cd ../.. && pnpm install --frozen-lockfile
cd ../.. && pnpm turbo run build --filter=@multacheck/web...
```

## Step 4 — Configura Supabase Auth callback

Una volta che hai l'URL Vercel, vai su Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://<tuo-url>.vercel.app`
- **Redirect URLs**: aggiungi `https://<tuo-url>.vercel.app/auth/callback`

Senza questo step, magic link e Google OAuth falliranno.

## Step 5 — Configura Sanity Webhook (opzionale)

Per l'ISR del Multa Magazine, vai su https://www.sanity.io/manage → Project → API → Webhooks:

- **URL**: `https://<tuo-url>.vercel.app/api/revalidate`
- **Trigger**: Create / Update / Delete su tutti i document
- **Secret**: lo stesso valore di `SANITY_REVALIDATE_SECRET`

## Troubleshooting

### Build fails con "Cannot find module '@multacheck/core'"
Vercel non sta usando pnpm workspace. Verifica che `apps/web/vercel.json` esista e che il `buildCommand` faccia `cd ../..` prima di `turbo build`.

### Function timeout (504)
Le route `/api/verbali/upload` e `/api/pratiche/[id]/genera-ricorso` hanno `maxDuration = 60`. Se Claude impiega troppo, considera di:
- Spezzare il flusso in due step (upload + analisi separati)
- Passare a Vercel Pro (300s max)

### Supabase Storage upload fail (403)
Verifica che il bucket `verbali` esista su Supabase e che le policy RLS permettano `INSERT/SELECT` per `auth.uid()`.

### Sanity Studio (`/studio`) non si apre
Sanity richiede CORS configurato. Vai su https://www.sanity.io/manage → API → CORS Origins e aggiungi:
- `https://<tuo-url>.vercel.app` (con credentials enabled)

## URL finale

Una volta deployato, l'app sarà accessibile su:
- **Magazine pubblico**: `https://<tuo-url>.vercel.app/magazine`
- **App**: `https://<tuo-url>.vercel.app/upload` (richiede login)
- **Sanity Studio**: `https://<tuo-url>.vercel.app/studio`
