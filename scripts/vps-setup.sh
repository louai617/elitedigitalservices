#!/usr/bin/env bash
#
# Set up the EMS site on an Ubuntu VPS (Hostinger or any other).
# Run as root ON THE VPS:
#
#   curl -fsSL https://raw.githubusercontent.com/louai617/elitedigitalservices/main/scripts/vps-setup.sh -o vps-setup.sh
#   bash vps-setup.sh
#
# Safe to re-run: every step checks what is already done. Run it again after
# pointing the domain at this server and it will add HTTPS.
#
# What it does:
#   1. installs Node.js 22, nginx, ffmpeg, certbot (adds swap on small VPSes)
#   2. creates an unprivileged `ems` user and clones the site to /var/www/ems
#   3. asks for your secrets (hidden input) and writes .env.local, mode 600
#   4. migrates the videos from Vercel Blob, re-encoded for fast playback,
#      to /var/www/ems-media — served by nginx at /media/
#   5. builds the site and runs it as a systemd service (restarts on crash/boot)
#   6. configures nginx, and HTTPS via Let's Encrypt once DNS points here
#   7. schedules daily blog generation if an AI key was given

set -euo pipefail

DOMAIN="elitemedia.qa"
REPO="https://github.com/louai617/elitedigitalservices.git"
APP_DIR="/var/www/ems"
MEDIA_DIR="/var/www/ems-media"
APP_USER="ems"
PORT=3000

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run as root (or with sudo)."
command -v apt-get >/dev/null || fail "This script expects Ubuntu or Debian."

# ------------------------------------------------------------ 1. packages --
bold "1/7  System packages"
export DEBIAN_FRONTEND=noninteractive

# `next build` needs ~2 GB of memory; give small VPSes swap so it cannot OOM.
mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$mem_mb" -lt 3000 ] && ! swapon --show | grep -q .; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ok "added 2 GB swap (${mem_mb} MB RAM)"
fi

apt-get update -qq
apt-get install -y -qq git curl ca-certificates nginx ffmpeg certbot python3-certbot-nginx dnsutils openssl >/dev/null
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
ok "node $(node -v), nginx, ffmpeg, certbot"

# --------------------------------------------------------------- 2. code ---
bold "2/7  Site code"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "$APP_USER"
mkdir -p "$APP_DIR" "$MEDIA_DIR"
if [ -d "$APP_DIR/.git" ]; then
  sudo -u "$APP_USER" git -C "$APP_DIR" pull -q --ff-only
  ok "updated $APP_DIR"
else
  chown "$APP_USER:$APP_USER" "$APP_DIR"
  sudo -u "$APP_USER" git clone -q "$REPO" "$APP_DIR"
  ok "cloned to $APP_DIR"
fi
cd "$APP_DIR"

# ------------------------------------------------------------ 3. secrets ---
bold "3/7  Secrets"
ENV_FILE="$APP_DIR/.env.local"
if [ -f "$ENV_FILE" ]; then
  ok "keeping existing .env.local (delete it and re-run to change values)"
else
  echo "  Typed values are hidden. They are stored only in $ENV_FILE on this server."
  read -rsp "  TELEGRAM_BOT_TOKEN: " TG_TOKEN </dev/tty; echo
  read -rp  "  TELEGRAM_CHAT_ID:   " TG_CHAT </dev/tty
  read -rp  "  ADMIN_USER (for /admin): " ADM_USER </dev/tty
  read -rsp "  ADMIN_PASSWORD:     " ADM_PASS </dev/tty; echo
  read -rsp "  AI_API_KEY (Enter to skip — blog auto-generation stays off): " AI_KEY </dev/tty; echo
  [ -n "$TG_TOKEN" ] && [ -n "$TG_CHAT" ] && [ -n "$ADM_USER" ] && [ -n "$ADM_PASS" ] || fail "Telegram and admin values are required."

  # Check the Telegram credentials now rather than after go-live.
  curl -fsS --max-time 15 "https://api.telegram.org/bot${TG_TOKEN}/getMe" >/dev/null || fail "Telegram rejected that bot token."
  curl -fsS --max-time 15 -X POST "https://api.telegram.org/bot${TG_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    -d "{\"chat_id\":\"${TG_CHAT}\",\"text\":\"✅ EMS website moving to its own server. Leads will keep arriving here.\"}" >/dev/null \
    || fail "Could not post to chat ${TG_CHAT} (group ids start with -; add the bot to the group first)."
  ok "Telegram verified — check for a test message"

  umask 077
  {
    echo "NEXT_PUBLIC_SITE_URL=https://${DOMAIN}"
    echo "TELEGRAM_BOT_TOKEN=${TG_TOKEN}"
    echo "TELEGRAM_CHAT_ID=${TG_CHAT}"
    echo "ADMIN_USER=${ADM_USER}"
    echo "ADMIN_PASSWORD=${ADM_PASS}"
    echo "CRON_SECRET=$(openssl rand -hex 32)"
    if [ -n "$AI_KEY" ]; then
      echo "AI_PROVIDER=anthropic"
      echo "AI_API_KEY=${AI_KEY}"
      echo "BLOG_ARTICLES_PER_DAY=1"
    fi
  } > "$ENV_FILE"
  umask 022
  chown "$APP_USER:$APP_USER" "$ENV_FILE"; chmod 600 "$ENV_FILE"
  unset TG_TOKEN TG_CHAT ADM_USER ADM_PASS AI_KEY
  ok "wrote .env.local (readable only by $APP_USER)"
fi

# -------------------------------------------------------------- 4. media ---
bold "4/7  Videos (migrating from Vercel Blob, optimizing for the web)"
STORE=$(node -p "require('./lib/media-manifest.json').blobStore")
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
for folder in $(node -p "Object.keys(require('./lib/media-manifest.json')).filter(k => Array.isArray(require('./lib/media-manifest.json')[k])).join(' ')"); do
  mkdir -p "$MEDIA_DIR/$folder"
  node -p "require('./lib/media-manifest.json')['$folder'].map(v => v.name + '|' + v.original).join('\n')" |
  while IFS='|' read -r name original; do
    out="$MEDIA_DIR/$folder/$name"
    if [ -s "$out.mp4" ] && [ -s "$out.jpg" ]; then ok "$folder/$name (already done)"; continue; fi
    # -nostdin below matters: this loop reads the video list from stdin, and
    # ffmpeg would otherwise swallow the remaining entries.
    curl -fsSL "$STORE/$original" -o "$TMP/in.mp4" || fail "could not download $STORE/$original"
    before=$(du -h "$TMP/in.mp4" | cut -f1)
    # Up to 1080p, capped bitrate, index at the front so playback starts at once.
    ffmpeg -nostdin -loglevel error -y -i "$TMP/in.mp4" -vf "scale='min(1920,iw)':-2" \
      -c:v libx264 -preset medium -crf 23 -maxrate 4M -bufsize 8M -profile:v high -pix_fmt yuv420p \
      -c:a aac -b:a 128k -movflags +faststart "$TMP/out.mp4"
    ffmpeg -nostdin -loglevel error -y -ss 3 -i "$TMP/out.mp4" -vf "thumbnail=60,scale=1280:-2" -frames:v 1 -q:v 4 "$TMP/out.jpg"
    mv "$TMP/out.mp4" "$out.mp4"; mv "$TMP/out.jpg" "$out.jpg"
    ok "$folder/$name  $before → $(du -h "$out.mp4" | cut -f1)"
  done
done
chmod -R a+rX "$MEDIA_DIR"

# -------------------------------------------------------------- 5. build ---
bold "5/7  Build and run"
# Articles generated on this server live in content/posts and public/blog;
# they must be writable by the app.
mkdir -p content/posts public/blog
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" npm ci --no-audit --no-fund --loglevel=error
sudo -u "$APP_USER" npm run build --silent >/dev/null
ok "built"

cat > /etc/systemd/system/ems.service <<UNIT
[Unit]
Description=EMS website (Next.js)
After=network.target

[Service]
User=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production PORT=${PORT}
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable --now ems >/dev/null 2>&1
systemctl restart ems
for i in $(seq 1 30); do curl -fs -o /dev/null "http://127.0.0.1:${PORT}/" && break; sleep 1; done
curl -fs -o /dev/null "http://127.0.0.1:${PORT}/" || fail "the site did not start — see: journalctl -u ems -n 50"
ok "running as a service (logs: journalctl -u ems -f)"

# -------------------------------------------------------------- 6. nginx ---
bold "6/7  Web server"
cat > /etc/nginx/sites-available/ems <<NGINX
map \$http_upgrade \$ems_connection_upgrade { default upgrade; '' close; }

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Videos and posters straight from disk: nginx handles range requests,
    # so playback starts immediately and seeking works.
    location /media/ {
        alias ${MEDIA_DIR}/;
        access_log off;
        add_header Cache-Control "public, max-age=604800";
    }

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        # Overwrite, don't append: nginx is the edge, and the contact form's
        # rate limiter trusts the first address in this header.
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \$ems_connection_upgrade;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/ems /etc/nginx/sites-enabled/ems
# Only remove the stock placeholder site, never anything else already here.
if [ -L /etc/nginx/sites-enabled/default ] && grep -q "Welcome to nginx" /var/www/html/index.nginx-debian.html 2>/dev/null; then
  rm -f /etc/nginx/sites-enabled/default
fi
nginx -t -q || fail "nginx config test failed"
systemctl reload nginx
if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then ufw allow 'Nginx Full' >/dev/null; ok "firewall: opened 80/443"; fi
ok "nginx serving ${DOMAIN}"

# HTTPS needs the domain to point here first.
SERVER_IP=$(curl -fs4 --max-time 10 https://api.ipify.org || hostname -I | awk '{print $1}')
DNS_IP=$(dig +short "$DOMAIN" A @1.1.1.1 | tail -1)  # public resolver: the VPS's own may cache the old IP
if [ "$DNS_IP" = "$SERVER_IP" ]; then
  if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    read -rp "  Email for SSL expiry notices: " SSL_EMAIL </dev/tty
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" --redirect -q
  fi
  ok "HTTPS active (renews automatically)"
  HTTPS_DONE=1
else
  warn "HTTPS skipped: ${DOMAIN} points to ${DNS_IP:-nothing}, this server is ${SERVER_IP}"
  HTTPS_DONE=0
fi

# ---------------------------------------------------------------- 7. cron --
bold "7/7  Daily blog generation"
if grep -q '^AI_API_KEY=' "$ENV_FILE"; then
  CRON_SECRET=$(grep '^CRON_SECRET=' "$ENV_FILE" | cut -d= -f2-)
  umask 077
  echo "0 6 * * * root curl -fsS -X POST http://127.0.0.1:${PORT}/api/cron/generate -H 'Authorization: Bearer ${CRON_SECRET}' >> /var/log/ems-blog.log 2>&1" > /etc/cron.d/ems-blog
  umask 022; chmod 600 /etc/cron.d/ems-blog
  ok "one article daily at 06:00 server time (log: /var/log/ems-blog.log)"
else
  ok "skipped — no AI_API_KEY. Add it to .env.local and re-run to enable."
fi

# --------------------------------------------------------------- summary --
bold "Done"
if [ "$HTTPS_DONE" = 1 ]; then
  echo "  Live at https://${DOMAIN}"
else
  cat <<EOF
  The site is running. Test it now at:  http://${SERVER_IP}

  Then point the domain here, in Routedge DNS:
    A      @      ${SERVER_IP}      (replace the current Vercel A record)
    A      www    ${SERVER_IP}      (delete the www CNAME to vercel-dns first)
  Leave MX, SPF, DKIM and _dmarc records alone.

  Once 'dig +short ${DOMAIN}' shows ${SERVER_IP}, run this script again —
  it will add HTTPS and finish.
EOF
fi
echo
echo "  To deploy future changes:  bash ${APP_DIR}/scripts/vps-deploy.sh"
