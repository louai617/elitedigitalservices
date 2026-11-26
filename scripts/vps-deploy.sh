#!/usr/bin/env bash
#
# Deploy the latest code from GitHub to the VPS. Run as root on the VPS:
#
#   bash /var/www/ems/scripts/vps-deploy.sh
#
# Pulls main, rebuilds, restarts. Also migrates any videos newly added to
# lib/media-manifest.json by re-running the media step of vps-setup.sh, and
# updates the team workspace (team.elitemedia.qa) when its code changed.

set -euo pipefail
APP_DIR="/var/www/ems"; APP_USER="ems"

[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }
cd "$APP_DIR"

# Every git command runs as the owning user: git refuses to operate on a
# repository owned by someone else ("dubious ownership").
g() { sudo -u "$APP_USER" git -C "$APP_DIR" "$@"; }
before=$(g rev-parse --short HEAD)
g pull -q --ff-only
after=$(g rev-parse --short HEAD)
echo "code: $before → $after"

# The team workspace, if installed (team-setup.sh). Before the website, since
# a media change below hands over to vps-setup.sh and doesn't come back.
if [ -f /etc/systemd/system/ems-team.service ] && ! g diff --quiet "$before" "$after" -- team; then
  echo "team workspace changed — updating"
  sudo -u "$APP_USER" -H bash -c "cd $APP_DIR/team && npm ci --no-audit --no-fund --loglevel=error && npx prisma migrate deploy >/dev/null && npm run build --silent >/dev/null"
  systemctl restart ems-team
  for i in $(seq 1 30); do curl -fs -o /dev/null http://127.0.0.1:3010/api/health && break; sleep 1; done
  curl -fs -o /dev/null http://127.0.0.1:3010/api/health && echo "✓ team workspace updated" || echo "✗ team workspace not responding — journalctl -u ems-team -n 50" >&2
fi

# New videos in the manifest? vps-setup.sh skips everything already done.
if ! g diff --quiet "$before" "$after" -- lib/media-manifest.json; then
  echo "media manifest changed — running full setup to migrate new videos"
  exec bash "$APP_DIR/scripts/vps-setup.sh"
fi

sudo -u "$APP_USER" npm ci --no-audit --no-fund --loglevel=error
sudo -u "$APP_USER" npm run build --silent >/dev/null
systemctl restart ems
for i in $(seq 1 30); do curl -fs -o /dev/null http://127.0.0.1:3000/ && break; sleep 1; done
curl -fs -o /dev/null http://127.0.0.1:3000/ && echo "✓ deployed $after" || { echo "✗ site not responding — journalctl -u ems -n 50" >&2; exit 1; }
