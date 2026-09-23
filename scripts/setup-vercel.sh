#!/usr/bin/env bash
#
# One-shot Vercel setup for elitemedia.qa.
#
#   bash scripts/setup-vercel.sh
#
# Sets the production environment variables, attaches the domain, and triggers
# a production deploy. Secrets are typed into your own terminal and passed
# straight to the Vercel CLI — they are never written to disk or committed.
#
# Re-runnable: existing variables are replaced rather than duplicated.

set -euo pipefail

DOMAIN="elitemedia.qa"
VC="npx --yes vercel@latest"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }

bold "EMS → Vercel setup"
echo

# ---------------------------------------------------------------- 1. auth ---
if ! $VC whoami >/dev/null 2>&1; then
  warn "Not logged in to Vercel. A browser window will open."
  $VC login
fi
ok "Logged in as $($VC whoami 2>/dev/null)"

# ---------------------------------------------------------------- 2. link ---
if [ ! -f .vercel/project.json ]; then
  echo
  bold "Linking this folder to the Vercel project"
  $VC link
fi
ok "Project linked"

# ------------------------------------------------------------ 3. secrets ---
echo
bold "Telegram credentials"
echo "  Bot token:  message @BotFather on Telegram, send /newbot"
echo "  Chat ID:    message @userinfobot (group IDs start with -)"
echo
read -rsp "  TELEGRAM_BOT_TOKEN: " TG_TOKEN; echo
read -rp  "  TELEGRAM_CHAT_ID:   " TG_CHAT
echo
bold "Admin login (protects /admin)"
read -rp  "  ADMIN_USER:     " ADM_USER
read -rsp "  ADMIN_PASSWORD: " ADM_PASS; echo

if [ -z "$TG_TOKEN" ] || [ -z "$TG_CHAT" ] || [ -z "$ADM_USER" ] || [ -z "$ADM_PASS" ]; then
  echo "All four values are required. Nothing was changed." >&2
  exit 1
fi

# Validate the Telegram credentials BEFORE storing them, so a typo surfaces
# here rather than as a silently dead contact form in production.
echo
bold "Verifying the Telegram bot"
if curl -fsS --max-time 15 "https://api.telegram.org/bot${TG_TOKEN}/getMe" >/dev/null 2>&1; then
  ok "Bot token is valid"
else
  echo "  ✗ Telegram rejected that bot token. Nothing was changed." >&2
  exit 1
fi

if curl -fsS --max-time 15 -X POST \
     "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
     -H 'Content-Type: application/json' \
     -d "{\"chat_id\":\"${TG_CHAT}\",\"text\":\"✅ EMS website connected. Leads from elitemedia.qa will arrive here.\"}" \
     >/dev/null 2>&1; then
  ok "Test message sent — check Telegram now"
else
  echo "  ✗ Could not post to chat ${TG_CHAT}." >&2
  echo "    For a group: add the bot to it, send any message, then read the id from" >&2
  echo "    https://api.telegram.org/bot<TOKEN>/getUpdates (group ids are negative)." >&2
  exit 1
fi

# --------------------------------------------------------------- 4. env ----
set_env() {
  local name="$1" value="$2"
  $VC env rm "$name" production --yes >/dev/null 2>&1 || true
  printf '%s' "$value" | $VC env add "$name" production >/dev/null 2>&1
  ok "$name"
}

echo
bold "Setting production environment variables"
set_env TELEGRAM_BOT_TOKEN   "$TG_TOKEN"
set_env TELEGRAM_CHAT_ID     "$TG_CHAT"
set_env ADMIN_USER           "$ADM_USER"
set_env ADMIN_PASSWORD       "$ADM_PASS"
set_env NEXT_PUBLIC_SITE_URL "https://${DOMAIN}"

unset TG_TOKEN TG_CHAT ADM_USER ADM_PASS

# ------------------------------------------------------------ 5. domain ----
echo
bold "Attaching the domain"
$VC domains add "$DOMAIN"     2>&1 | sed 's/^/  /' || warn "$DOMAIN may already be attached"
$VC domains add "www.$DOMAIN" 2>&1 | sed 's/^/  /' || warn "www.$DOMAIN may already be attached"

# ------------------------------------------------------------ 6. deploy ----
echo
bold "Deploying to production"
$VC --prod --yes 2>&1 | tail -5 | sed 's/^/  /'

# --------------------------------------------------------------- 7. DNS ----
cat <<EOF

$(bold "Last step — DNS at Routedge")

  REPLACE the existing Hostinger records. Do not add alongside them.

    A      @      76.76.21.21
    CNAME  www    cname.vercel-dns.com

  Delete the current A records on @ (93.127.179.133 and any others) and the
  existing 'www' CNAME pointing at *.cdn.hstgr.net.

  LEAVE ALONE — these keep your email working:
    MX     mx1.hostinger.com / mx2.hostinger.com
    TXT    v=spf1...   _dmarc   *._domainkey

  If Vercel printed different records above, use Vercel's.

$(bold "Then verify")

    dig +short $DOMAIN A
    curl -sI https://$DOMAIN | grep -i server

  'server: Vercel' means it is live. SSL is issued automatically.

EOF
