#!/usr/bin/env bash
#
# Diagnose the Express → Entry data mapping against the live backend.
#
#   1. Reads SELAH_API_URL / SELAH_API_TOKEN from .env.local
#   2. Fetches the RAW upstream /entries payload and reports its shape
#   3. If `next dev` is running, fetches the MAPPED /api/entries and flags any
#      empty critical fields (the symptom of a key mismatch in toEntry())
#
# Usage:  npm run check:mapping     (start `npm run dev` in another shell first)

set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
[ -f "$ENV_FILE" ] || { echo "✗ No .env.local. Create it with SELAH_API_URL + SELAH_API_TOKEN."; exit 1; }

read_var() { grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//'; }
API_URL="$(read_var SELAH_API_URL)"; API_URL="${API_URL%/}"
API_TOKEN="$(read_var SELAH_API_TOKEN)"

[ -n "$API_URL" ] || { echo "✗ SELAH_API_URL is blank in .env.local — add your Render URL first."; exit 1; }

AUTH=()
[ -n "$API_TOKEN" ] && AUTH=(-H "authorization: Bearer $API_TOKEN")

echo "▶ RAW   GET $API_URL/entries"
RAW="$(curl -s -m 20 "${AUTH[@]}" "$API_URL/entries")" || { echo "  ✗ request failed"; exit 1; }

printf '%s' "$RAW" | python3 - <<'PY'
import sys, json
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception as e:
    print("  ✗ Not JSON:", e); print("  body:", raw[:300]); sys.exit(1)

if isinstance(d, dict):
    print("  envelope object — keys:", list(d.keys()))
    for k in ("data", "entries", "items", "results"):
        if isinstance(d.get(k), list):
            d = d[k]; print(f"  → list found under '{k}'"); break
if isinstance(d, list):
    print(f"  {len(d)} entries")
    if d and isinstance(d[0], dict):
        print("  first entry keys:", list(d[0].keys()))
        print("  first entry:", json.dumps(d[0], indent=2)[:500])
PY

echo
echo "▶ MAPPED  GET localhost:3000/api/entries  (needs \`npm run dev\`)"
if curl -sf -m 5 localhost:3000/api/entries >/dev/null 2>&1; then
  curl -s localhost:3000/api/entries | python3 - <<'PY'
import sys, json
d = json.load(sys.stdin)
if not isinstance(d, list) or not d:
    print("  (no entries mapped — is SELAH_API_URL set in the dev server's env?)"); sys.exit()
e = d[0]
print("  first mapped Entry:")
print(json.dumps(e, indent=2)[:600])
missing = [k for k in ("id", "title", "body", "createdAt") if not e.get(k)]
print("  ⚠ empty critical fields:", missing or "none ✓")
print("  attachments:", len(e.get("attachments", [])), "| author:", e.get("author"))
if missing:
    print("  → those keys differ in your payload; paste a raw entry and toEntry() can be aligned.")
PY
else
  echo "  dev server not reachable on :3000 — run \`npm run dev\`, then re-run this."
fi
