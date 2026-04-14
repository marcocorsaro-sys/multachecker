/**
 * Bulk import dei contenuti iniziali in Sanity.
 *
 * Legge i file .ndjson in `content/` e li carica su Sanity via @sanity/client
 * usando createOrReplace, così che rilanciare lo script sovrascriva i
 * documenti esistenti senza duplicati.
 *
 * Uso (dal root del monorepo):
 *
 *   SANITY_PROJECT_ID=9zy1q6a1 \
 *   SANITY_DATASET=production \
 *   SANITY_WRITE_TOKEN=<token-editor-temporaneo> \
 *   pnpm --filter @multacheck/web import-content
 *
 * Dopo l'import, vai su Sanity → Settings → API → Tokens e REVOCA il token
 * editor temporaneo. Non è piu necessario: il sito funzionera con il solo
 * SANITY_API_READ_TOKEN (viewer) gia configurato su Vercel.
 */

import { createClient } from "next-sanity";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const CONTENT_DIR = join(REPO_ROOT, "content");

function fail(msg: string): never {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

const projectId = process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? "production";
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId) {
  fail(
    "SANITY_PROJECT_ID mancante. Esegui con: SANITY_PROJECT_ID=xxxxxxxx SANITY_WRITE_TOKEN=sk... pnpm --filter @multacheck/web import-content"
  );
}
if (!token) {
  fail(
    "SANITY_WRITE_TOKEN mancante. Crea un token con permission 'Editor' su https://www.sanity.io/manage/personal/project/" +
      projectId +
      "/api/tokens, poi rilancia lo script. REVOCA il token subito dopo l'import."
  );
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2026-04-01",
  token,
  useCdn: false,
});

type SanityDoc = {
  _id: string;
  _type: string;
  [key: string]: unknown;
};

async function importFile(filePath: string): Promise<{ ok: number; fail: number }> {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);

  let ok = 0;
  let failed = 0;

  console.log(`\n📄 ${filePath.replace(REPO_ROOT + "/", "")}`);
  console.log(`   ${lines.length} documenti da importare`);

  for (const line of lines) {
    let doc: SanityDoc;
    try {
      doc = JSON.parse(line);
    } catch (err) {
      console.error(`   ✗ Riga non valida: ${(err as Error).message}`);
      failed++;
      continue;
    }

    if (!doc._id || !doc._type) {
      console.error(`   ✗ Documento senza _id o _type: ${JSON.stringify(doc).slice(0, 80)}...`);
      failed++;
      continue;
    }

    try {
      await client.createOrReplace(doc);
      console.log(`   ✓ ${doc._type} ${doc._id}`);
      ok++;
    } catch (err) {
      console.error(`   ✗ ${doc._type} ${doc._id}: ${(err as Error).message}`);
      failed++;
    }
  }

  return { ok, fail: failed };
}

async function main() {
  console.log(`\n🚀 Sanity bulk import`);
  console.log(`   Project: ${projectId}`);
  console.log(`   Dataset: ${dataset}`);
  console.log(`   Content: ${CONTENT_DIR}`);

  const files = readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".ndjson"))
    .map((f) => join(CONTENT_DIR, f))
    .sort();

  if (files.length === 0) {
    fail(`Nessun file .ndjson trovato in ${CONTENT_DIR}`);
  }

  let totalOk = 0;
  let totalFail = 0;

  for (const file of files) {
    const { ok, fail: failed } = await importFile(file);
    totalOk += ok;
    totalFail += failed;
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✔ Importati:   ${totalOk}`);
  if (totalFail > 0) {
    console.log(`✗ Falliti:     ${totalFail}`);
  }
  console.log(`─────────────────────────────────────\n`);

  if (totalFail > 0) {
    process.exit(1);
  }

  console.log(`Ora vai su https://${projectId}.sanity.studio o sul tuo /studio deployato`);
  console.log(`per vedere i documenti importati. Poi REVOCA il token Editor usato per l'import.\n`);
}

main().catch((err) => {
  console.error(`\n❌ Errore inatteso:`, err);
  process.exit(1);
});
