#!/usr/bin/env bash
#
# Re-encode the Medical videos for fast web playback and upload them.
#
#   bash scripts/optimize-videos.sh
#
# For each video it:
#   1. downloads the original from Vercel Blob
#   2. re-encodes it: max 1080p, H.264, capped bitrate, and — most importantly —
#      the index moved to the start of the file ("faststart"), so playback can
#      begin before the whole file has downloaded
#   3. grabs a cover image (poster) shown instantly before playback
#   4. uploads both to medical/<name>.mp4 and medical/<name>.jpg
#
# The site already points at those paths and falls back to the originals until
# they exist, so it is safe to run this before or after deploying.
# Originals are left untouched in Blob.

set -euo pipefail

STORE="https://xn1wb9rstmi0a9aj.public.blob.vercel-storage.com"
VC="npx --yes vercel@latest"

# name|original path (URL-encoded, as uploaded)
VIDEOS=(
  "dr-rana|dr.rana%20final%20V6.mp4"
  "dr-nahed|dr%20nahed%20v5.mp4"
  "dr-hazar|dr%20hazar%20final%20v7%20corrected%202.mp4"
  "dr-ameer|dr%20ameer%20v3.mp4"
  "dr-ala|dr%20ala%20v4.mp4"
  "dr-ala-2|dr%20ala%201611%20v6.mp4"
  "dr-abu-jalala|dr%20abu%20jalala%20v4.mp4"
)

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1" >&2; exit 1; }

# ------------------------------------------------------------- ffmpeg ------
if ! command -v ffmpeg >/dev/null; then
  if command -v brew >/dev/null; then
    bold "Installing ffmpeg (one time, a few minutes)"
    brew install ffmpeg
  else
    fail "ffmpeg is needed. Install Homebrew from https://brew.sh, then run: brew install ffmpeg"
  fi
fi
ok "ffmpeg ready"

# -------------------------------------------------------- upload token -----
if [ -z "${BLOB_READ_WRITE_TOKEN:-}" ] && [ -f .env.local ]; then
  BLOB_READ_WRITE_TOKEN=$(grep -E '^BLOB_READ_WRITE_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '"' || true)
fi
if [ -z "${BLOB_READ_WRITE_TOKEN:-}" ]; then
  bold "Fetching the Blob upload token from Vercel"
  $VC env pull .env.local --yes >/dev/null
  BLOB_READ_WRITE_TOKEN=$(grep -E '^BLOB_READ_WRITE_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '"' || true)
fi
[ -n "${BLOB_READ_WRITE_TOKEN:-}" ] || fail "No BLOB_READ_WRITE_TOKEN. In Vercel → Storage → your Blob store → .env.local tab, copy the token, then: export BLOB_READ_WRITE_TOKEN=..."
ok "upload token found"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

human() { du -h "$1" | cut -f1 | tr -d ' '; }

for entry in "${VIDEOS[@]}"; do
  name="${entry%%|*}"; path="${entry#*|}"
  echo; bold "$name"

  curl -fsSL "$STORE/$path" -o "$WORK/$name-orig.mp4" || fail "could not download $path"
  ok "downloaded ($(human "$WORK/$name-orig.mp4"))"

  ffmpeg -loglevel error -y -i "$WORK/$name-orig.mp4" \
    -vf "scale='min(1920,iw)':-2" \
    -c:v libx264 -preset slow -crf 23 -maxrate 4M -bufsize 8M \
    -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -movflags +faststart \
    "$WORK/$name.mp4"
  ok "optimized ($(human "$WORK/$name.mp4"), faststart)"

  # Pick a representative frame a few seconds in, past any fade-in or logo.
  ffmpeg -loglevel error -y -ss 3 -i "$WORK/$name.mp4" \
    -vf "thumbnail=60,scale=1280:-2" -frames:v 1 -q:v 4 "$WORK/$name.jpg"
  ok "poster ($(human "$WORK/$name.jpg"))"

  for ext in mp4 jpg; do
    $VC blob put "$WORK/$name.$ext" --pathname "medical/$name.$ext" \
      --access public --force --rw-token "$BLOB_READ_WRITE_TOKEN" >/dev/null
    code=$(curl -s -o /dev/null -w '%{http_code}' -I "$STORE/medical/$name.$ext")
    [ "$code" = "200" ] || fail "uploaded medical/$name.$ext but $STORE/medical/$name.$ext returns $code — the token may belong to a different Blob store"
  done
  ok "uploaded"
done

echo
bold "All 7 videos optimized and live."
echo "  If the latest site code is already deployed, just hard-reload"
echo "  elitemedia.qa/projects/medical (⌘⇧R). Otherwise run: npx vercel --prod"
