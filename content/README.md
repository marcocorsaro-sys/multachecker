# Content drafts per Sanity

Questa cartella contiene i draft dei contenuti MultaAI pronti per essere importati in Sanity.

## Struttura

```
content/
├── glossary-initial.ndjson          # 10 termini glossario
├── site-and-infractions.ndjson      # siteSettings + 6 category + 6 infraction
├── articles/                        # Articoli pilastro in Markdown
│   └── 01-velocita-come-contestare-autovelox.md
└── README.md
```

## Come importare in Sanity

### Documenti strutturati (glossary, category, infraction, siteSettings)

I file `.ndjson` sono in formato Sanity Content Lake, uno JSON per riga. Si importano tutti insieme con il CLI Sanity:

```bash
cd apps/web
npx sanity dataset import ../../content/glossary-initial.ndjson production --replace
npx sanity dataset import ../../content/site-and-infractions.ndjson production --replace
```

`--replace` sovrascrive documenti con lo stesso `_id` se già esistono. Ometti la flag se vuoi che i duplicati diano errore.

### Articoli (Markdown)

Gli articoli sono in Markdown semplice con front-matter YAML. Per importarli in Sanity:

**Opzione A (manuale, consigliata per i primi articoli):**
1. Apri Sanity Studio su `/studio`
2. Crea un nuovo documento di tipo "Articolo"
3. Compila i campi del front-matter (title, slug, excerpt, category, ecc.)
4. Nel campo "body", incolla il corpo Markdown — Sanity Studio ha un parser automatico che converte Markdown → Portable Text per H2/H3/liste/blockquote/bold/italic/link

**Opzione B (script di import):**
TODO — scrivere uno script Node in `apps/web/scripts/import-articles.ts` che usa `@sanity/client` + `@portabletext/block-tools` per convertire Markdown a Portable Text e caricare in batch. Utile quando gli articoli saranno 50+.

## Convenzioni di naming

- **ID dei documenti**: `<tipo>-<slug>` in kebab case. Es: `glossary-autovelox`, `article-pillar-velocita`, `category-sosta`.
- **Slug**: derivati dal nome del documento, kebab case, senza accenti. Es: "Giudice di Pace" → `giudice-di-pace`.
- **Riferimenti tra documenti**: usa sempre `_ref` con l'`_id` esatto del documento referenziato. Es. il campo `category` di un articolo è `{"_ref": "category-velocita", "_type": "reference"}`.

## Aggiornamento dei documenti

Per aggiornare un documento già importato senza perdere riferimenti, basta modificare il file e rilanciare l'import con `--replace`. Sanity mantiene lo stesso `_id` e aggiorna i campi.

## Stato attuale dei contenuti

- [x] 10 `glossaryTerm` (autovelox, verbale, prefettura, giudice di pace, notifica tardiva, pagamento ridotto, ricorso gerarchico, ZTL, tolleranza, PEC)
- [x] 1 `siteSettings`
- [x] 6 `category` (velocità, ZTL, sosta, semaforo, telefono, altro)
- [x] 6 `infraction` (con sanzioni min/max, punti, vizi comuni)
- [x] 1 `article` pilastro — Velocità / autovelox
- [ ] 4 `article` pilastro — ZTL, Sosta, Semaforo, Telefono
- [ ] 20 `faqEntry`
- [ ] `author` (quando avremo avvocato o useremo un nome editoriale)
- [ ] `article` satelliti (12-16 articoli short-form per cluster)
- [ ] `legalDisclaimer` (singleton) — testo legale per T&C

## Tono di voce

Amichevole informale. "Basta pagare multe ingiuste". Esempi:
- ❌ "La notifica del verbale è soggetta al termine decadenziale di 90 giorni"
- ✅ "Hai ricevuto la raccomandata più di 3 mesi dopo che l'hanno scritta? La multa è nulla e basta."
