#!/usr/bin/env bash
#
# Deploy the latest code from GitHub to the VPS. Run as root on the VPS:
#
#   bash /var/www/ems/scripts/vps-deploy.sh
#
# Pulls main, rebuilds, restarts. Also migrates any videos newly added to
# lib/media-manifest.json by re-running the media step of vps-setup.sh.

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
