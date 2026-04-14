#!/usr/bin/env bash
#
# push-env.sh — Pusha tutte le environment variables di .env.production.local
# verso il progetto Vercel collegato (production + preview + development).
#
# Prerequisiti:
#   1. Vercel CLI installata:        npm i -g vercel
#   2. Login fatto:                  vercel login
#   3. Progetto linkato:             vercel link  (esegui dentro apps/web)
#   4. File .env.production.local creato in apps/web/ con i valori reali
#
# Uso:
#   cd apps/web
#   ./scripts/push-env.sh
#
# Lo script è IDEMPOTENTE: rimuove eventuali var esistenti con lo stesso
# nome e le riscrive. Salta automaticamente quelle vuote o coi placeholder.

set -euo pipefail

# Vai sempre nella dir del package web (radice di .vercel/)
cd "$(dirname "$0")/.."

ENV_FILE=".env.production.local"

# --- Pre-flight checks ---

if ! command -v vercel &> /dev/null; then
  echo "ERRORE: Vercel CLI non installata."
  echo "  Installa con: npm i -g vercel"
  exit 1
fi

if [ ! -d ".vercel" ]; then
  echo "ERRORE: progetto Vercel non collegato."
  echo "  Esegui prima: vercel link"
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERRORE: $ENV_FILE non trovato in apps/web/"
  echo "  Crea il file copiandolo da .env.example:"
  echo "    cp .env.example $ENV_FILE"
  echo "  Poi compila i valori reali e rilancia questo script."
  exit 1
fi

# --- Loop sulle variabili ---

total=0
pushed=0
skipped=0

while IFS= read -r line || [ -n "$line" ]; do
  # Salta righe vuote e commenti
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  # Estrai key=value
  key="${line%%=*}"
  value="${line#*=}"

  # Trim spazi
  key="$(echo "$key" | xargs)"

  # Rimuove eventuali virgolette dal valore
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  total=$((total + 1))

  # Salta valori vuoti o placeholder ovvi
  if [[ -z "$value" \
        || "$value" == *"your-"* \
        || "$value" == *"placeholder"* \
        || "$value" == "..." \
        || "$value" == *"sk-ant-..." \
        || "$value" == *"sk_test_..." \
        || "$value" == *"whsec_..." ]]; then
    echo "  [skip]  $key  (valore mancante o placeholder)"
    skipped=$((skipped + 1))
    continue
  fi

  echo "  [push]  $key"

  # Rimuove versioni esistenti (silenziosamente)
  for env in production preview development; do
    vercel env rm "$key" "$env" --yes &> /dev/null || true
  done

  # Aggiunge a tutti gli ambienti
  for env in production preview development; do
    printf '%s' "$value" | vercel env add "$key" "$env" &> /dev/null
  done

  pushed=$((pushed + 1))
done < "$ENV_FILE"

echo ""
echo "Riepilogo: $pushed pushate / $skipped saltate / $total totali"
echo ""
echo "Per applicare le nuove variabili al deployment esistente, ridepoya:"
echo "  vercel --prod"
echo ""
echo "Oppure pusha un commit qualsiasi e Vercel ribuilda automaticamente."
