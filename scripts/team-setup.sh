#!/usr/bin/env bash
#
# Install the EMS Team workspace (team.elitemedia.qa) on the VPS, next to the
# website. Run as root ON THE VPS, after vps-setup.sh has run once:
#
#   bash /var/www/ems/scripts/team-setup.sh
#
# Safe to re-run. It never touches the website, the Real Estate sites or any
# other database: it only adds its own database, service and nginx site.
#
#   1. PostgreSQL + a dedicated `ems_team` database and user
#   2. team/.env (database URL, files folder), mode 600
#   3. install, migrate the database, build
#   4. systemd service `ems-team` on port 3010
#   5. nginx site for team.<domain>, HTTPS once its DNS record points here
#   6. nightly database backup, kept 14 days
#   7. your first account (Project Manager), if none exists yet

set -euo pipefail

DOMAIN="elitemedia.qa"
HOST="team.${DOMAIN}"
APP_DIR="/var/www/ems"
TEAM_DIR="${APP_DIR}/team"
FILES_DIR="/var/www/ems-team-files"
BACKUP_DIR="/var/backups/ems-team"
APP_USER="ems"
PORT=3010
DB_NAME="ems_team"
DB_USER="ems_team"

bold() { printf '\n\033[1m%s\033[0m\n' "$1"; }
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1" >&2; exit 1; }
as_app() { sudo -u "$APP_USER" -H bash -c "cd '$TEAM_DIR' && $1"; }

[ "$(id -u)" -eq 0 ] || fail "Run as root."
[ -d "$APP_DIR/.git" ] || fail "Run vps-setup.sh first (no site at $APP_DIR)."
export DEBIAN_FRONTEND=noninteractive

# Latest code (the team app lives in the same repository as the website).
sudo -u "$APP_USER" git -C "$APP_DIR" pull -q --ff-only || warn "could not pull; using the code already there"
[ -d "$TEAM_DIR" ] || fail "No team/ folder in $APP_DIR — is the code up to date?"

# ------------------------------------------------------------ 1. database --
bold "1/7  Database"
if ! command -v psql >/dev/null; then
  apt-get update -qq && apt-get install -y -qq postgresql >/dev/null
fi
systemctl enable --now postgresql >/dev/null 2>&1 || true
ok "PostgreSQL $(psql --version | awk '{print $3}')"

ENV_FILE="$TEAM_DIR/.env"
if [ -f "$ENV_FILE" ] && grep -q '^DATABASE_URL=' "$ENV_FILE"; then
  ok "keeping existing database credentials"
else
  DB_PASS=$(openssl rand -hex 24)
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
    sudo -u postgres psql -qc "ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';"
  else
    sudo -u postgres psql -qc "CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';"
  fi
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
    || sudo -u postgres psql -qc "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  umask 077
  cat > "$ENV_FILE" <<ENV
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
FILES_DIR="${FILES_DIR}"
ENV
  umask 022
  ok "created database ${DB_NAME} (password generated, stored only in team/.env)"
fi

# ---------------------------------------------------------------- 2. files --
bold "2/7  Files folder"
mkdir -p "$FILES_DIR"
chown -R "$APP_USER:$APP_USER" "$FILES_DIR" "$TEAM_DIR"
chmod 700 "$FILES_DIR"
chmod 600 "$ENV_FILE"
ok "uploads go to $FILES_DIR (private: served only to signed-in project members)"

# ---------------------------------------------------------------- 3. build --
bold "3/7  Install, migrate, build"
as_app "npm ci --no-audit --no-fund --loglevel=error"
as_app "npx prisma migrate deploy" | grep -E "applied|No pending" || true
as_app "npm run build --silent" >/dev/null
ok "built"

# -------------------------------------------------------------- 4. service --
bold "4/7  Service"
cat > /etc/systemd/system/ems-team.service <<UNIT
[Unit]
Description=EMS Team workspace (Next.js)
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${TEAM_DIR}
Environment=NODE_ENV=production
Environment=PORT=${PORT}
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable ems-team >/dev/null 2>&1
systemctl restart ems-team
for i in $(seq 1 30); do curl -fs -o /dev/null "http://127.0.0.1:${PORT}/api/health" && break; sleep 1; done
curl -fs -o /dev/null "http://127.0.0.1:${PORT}/api/health" && ok "running on port ${PORT}" || fail "not responding — journalctl -u ems-team -n 50"

# ---------------------------------------------------------------- 5. nginx --
bold "5/7  Web server"
SITE=/etc/nginx/sites-available/ems-team
if [ ! -f "$SITE" ]; then
  cat > "$SITE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${HOST};

    # Deliverables (photo sets, video cuts) are uploaded through the app.
    client_max_body_size 260m;
    proxy_request_buffering off;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        # Overwritten, not appended: the login rate limit trusts this header.
        proxy_set_header X-Forwarded-For \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
NGINX
  ln -sf "$SITE" /etc/nginx/sites-enabled/ems-team
  nginx -t -q && systemctl reload nginx
  ok "nginx site for ${HOST}"
else
  ok "nginx site already there (certbot's HTTPS lines kept)"
fi

SERVER_IP=$(curl -fs4 --max-time 10 https://api.ipify.org || hostname -I | awk '{print $1}')
DNS_IP=$(dig +short "$HOST" A @1.1.1.1 | tail -1)
if [ -d "/etc/letsencrypt/live/${HOST}" ]; then
  ok "HTTPS active for ${HOST}"
elif [ "$DNS_IP" = "$SERVER_IP" ]; then
  certbot --nginx -d "$HOST" --non-interactive --agree-tos --register-unsafely-without-email --redirect -q \
    && ok "HTTPS active for ${HOST}" || warn "certbot failed — re-run this script in a few minutes"
else
  warn "HTTPS waits for DNS: add  A  team  ${SERVER_IP}  in Routedge, then re-run this script"
fi

# -------------------------------------------------------------- 6. backups --
bold "6/7  Backups"
mkdir -p "$BACKUP_DIR" && chmod 700 "$BACKUP_DIR"
cat > /etc/cron.d/ems-team-backup <<CRON
# Nightly database dump for EMS Team, 14 days kept.
SHELL=/bin/bash
30 2 * * * root sudo -u postgres pg_dump ${DB_NAME} | gzip > ${BACKUP_DIR}/${DB_NAME}-\$(date +\%F).sql.gz && find ${BACKUP_DIR} -name '*.sql.gz' -mtime +14 -delete
CRON
ok "nightly at 02:30 → ${BACKUP_DIR}"

# -------------------------------------------------------- 7. first account --
bold "7/7  Accounts"
USERS=$(sudo -u postgres psql -d "$DB_NAME" -tAc 'SELECT count(*) FROM "User"')
if [ "$USERS" = "0" ]; then
  echo "  Create your own account (Project Manager — full access):"
  as_app "node scripts/create-user.mjs --role PROJECT_MANAGER" </dev/tty
  echo "  Add the CEO and everyone else from the Team page once you're signed in."
else
  ok "${USERS} account(s) exist — manage them from the Team page"
fi

printf '\n\033[1mDone\033[0m\n'
if [ -d "/etc/letsencrypt/live/${HOST}" ]; then
  echo "  Open https://${HOST}"
else
  echo "  1. In Routedge DNS add:   A   team   ${SERVER_IP}"
  echo "  2. Wait ~15 minutes, then run this script again for HTTPS."
  echo "  3. Open https://${HOST}"
fi
echo "  Forgot a password? On the server:  cd ${TEAM_DIR} && sudo -u ${APP_USER} node scripts/create-user.mjs"
