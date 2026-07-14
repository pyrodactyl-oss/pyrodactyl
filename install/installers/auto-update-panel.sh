#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Hydrodactyl Docker Auto-Updater                                                    #
#                                                                                    #
# Pulls the latest GHCR image and restarts the Docker stack.                         #
#                                                                                    #
######################################################################################

PANEL_REPO="${PANEL_REPO:-itzzmateo/hydrodactyl}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/hydrodactyl}"
LOG_FILE="${LOG_FILE:-/var/log/hydrodactyl-auto-update.log}"
LOCK_FILE="${LOCK_FILE:-/var/run/hydrodactyl-update.lock}"
CRON_MODE=false
VERBOSE=false

setup_colors() {
  if [ "$CRON_MODE" == true ] || [ ! -t 1 ]; then
    COLOR_GREEN=''; COLOR_YELLOW=''; COLOR_RED=''; COLOR_NC=''
  else
    COLOR_GREEN='\033[0;32m'; COLOR_YELLOW='\033[1;33m'
    COLOR_RED='\033[0;31m'; COLOR_NC='\033[0m'
  fi
}

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "$msg"
  [ "$CRON_MODE" == true ] && echo "$msg" >> "$LOG_FILE" 2>/dev/null || true
}

acquire_lock() {
  mkdir -p "$(dirname "$LOCK_FILE")"
  if [ -f "$LOCK_FILE" ]; then
    local pid; pid=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Another update process is running (PID: $pid)"; exit 2
    fi
    rm -f "$LOCK_FILE"
  fi
  echo $$ > "$LOCK_FILE"
}

release_lock() { rm -f "$LOCK_FILE"; }
trap release_lock EXIT INT TERM

check_for_updates() {
  log "Checking for new Docker image: ghcr.io/$PANEL_REPO:latest"

  local old_id new_id
  old_id=$(docker image inspect "ghcr.io/$PANEL_REPO:latest" --format '{{.Id}}' 2>/dev/null || echo "none")

  if ! docker pull "ghcr.io/$PANEL_REPO:latest" 2>/dev/null; then
    log "ERROR: Failed to pull image"
    return 1
  fi

  new_id=$(docker image inspect "ghcr.io/$PANEL_REPO:latest" --format '{{.Id}}' 2>/dev/null)

  if [ "$old_id" == "$new_id" ]; then
    log "Already up to date (image unchanged)"
    return 0
  fi

  log "Update available. Redeploying stack..."
  cd "$COMPOSE_DIR"
  docker compose up -d --pull always 2>&1 | while IFS= read -r line; do log "  $line"; done
  log "SUCCESS: Stack redeployed with latest image"
  return 0
}

main() {
  while [[ $# -gt 0 ]]; do case $1 in
    --cron) CRON_MODE=true; LOG_TO_FILE=true; shift ;;
    --verbose|-v) VERBOSE=true; shift ;;
    --help|-h) echo "Hydrodactyl Docker Auto-Updater"; exit 0 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac; done

  setup_colors
  acquire_lock

  if [ ! -d "$COMPOSE_DIR" ] || [ ! -f "$COMPOSE_DIR/docker-compose.yml" ]; then
    log "ERROR: Compose directory not found at $COMPOSE_DIR"
    exit 1
  fi

  check_for_updates
}

main "$@"
