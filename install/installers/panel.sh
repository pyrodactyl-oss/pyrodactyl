#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Hydrodactyl Panel Installer (Docker / Dokploy)                                     #
#                                                                                    #
######################################################################################

fn_exists() { declare -F "$1" >/dev/null; }
if ! fn_exists lib_loaded; then
  if [ -f /tmp/pyrodactyl-lib.sh ]; then
    if ! source /tmp/pyrodactyl-lib.sh 2>/dev/null; then
      rm -f /tmp/pyrodactyl-lib.sh
    fi
  fi
  if ! fn_exists lib_loaded; then
    source <(curl -sSL "${GITHUB_BASE_URL:-"https://raw.githubusercontent.com/itzzmateo/hydrodactyl/install"}/${GITHUB_SOURCE:-"main"}/lib/lib.sh")
  fi
  ! fn_exists lib_loaded && echo "* ERROR: Could not load lib script" && exit 1
fi

PANEL_REPO="${PANEL_REPO:-itzzmateo/hydrodactyl}"
PANEL_FQDN="${PANEL_FQDN:-}"
PANEL_TIMEZONE="${PANEL_TIMEZONE:-UTC}"
PANEL_ADMIN_EMAIL="${PANEL_ADMIN_EMAIL:-}"
PANEL_ADMIN_USERNAME="${PANEL_ADMIN_USERNAME:-}"
PANEL_ADMIN_FIRSTNAME="${PANEL_ADMIN_FIRSTNAME:-}"
PANEL_ADMIN_LASTNAME="${PANEL_ADMIN_LASTNAME:-}"
PANEL_ADMIN_PASSWORD="${PANEL_ADMIN_PASSWORD:-}"
ASSUME_SSL="${ASSUME_SSL:-false}"
CONFIGURE_FIREWALL="${CONFIGURE_FIREWALL:-false}"
PANEL_REPO_PRIVATE="${PANEL_REPO_PRIVATE:-false}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"
PANEL_VERSION="${PANEL_VERSION:-latest}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/hydrodactyl}"

DB_PASSWORD="${DB_PASSWORD:-$(gen_passwd 64)}"
DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD:-$(gen_passwd 64)}"
HASHIDS_SALT="${HASHIDS_SALT:-$(gen_passwd 20)}"

validate_configuration() {
  print_flame "Validating Configuration"

  local missing=()
  [ -z "$PANEL_FQDN" ] && missing+=("PANEL_FQDN")
  [ -z "$PANEL_ADMIN_EMAIL" ] && missing+=("PANEL_ADMIN_EMAIL")

  if [ ${#missing[@]} -gt 0 ]; then
    error "Missing required configuration variables:"
    for var in "${missing[@]}"; do
      output "  - $var"
    done
    exit 1
  fi

  if ! check_fqdn "$PANEL_FQDN"; then
    error "Invalid FQDN: $PANEL_FQDN"
    exit 1
  fi

  success "Configuration valid"
}

install_dependencies() {
  print_flame "Installing Docker & Dependencies"

  if ! cmd_exists docker; then
    output "Installing Docker..."
    curl -fsSL https://get.docker.com | bash
    systemctl enable --now docker
  else
    output "Docker already installed"
  fi

  if ! cmd_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    output "Installing Docker Compose plugin..."
    apt-get install -y docker-compose-plugin 2>/dev/null || \
    dnf install -y docker-compose-plugin 2>/dev/null
  fi

  install_packages "curl tar unzip git jq"

  success "Dependencies installed"
}

setup_directories() {
  print_flame "Setting up Directories"

  mkdir -p "$COMPOSE_DIR"/{var,storage,secrets}
  chmod 755 "$COMPOSE_DIR"
  success "Directories created at $COMPOSE_DIR"
}

generate_compose() {
  print_flame "Generating Docker Compose"

  local app_url="http://$PANEL_FQDN"
  [ "$ASSUME_SSL" == true ] && app_url="https://$PANEL_FQDN"

  cat > "$COMPOSE_DIR/docker-compose.yml" <<EOF
name: hydrodactyl

services:
  panel:
    image: ghcr.io/itzzmateo/hydrodactyl:${PANEL_VERSION}
    restart: always
    networks:
      - dokploy-network
    volumes:
      - panel_var:/app/var
      - panel_storage:/app/storage
    environment:
      APP_URL: ${app_url}
      APP_ENV: production
      APP_ENVIRONMENT_ONLY: "false"
      APP_TIMEZONE: ${PANEL_TIMEZONE}
      APP_KEY:
      DB_CONNECTION: mariadb
      DB_HOST: mariadb
      DB_PORT: "3306"
      DB_DATABASE: panel
      DB_USERNAME: hydrodactyl
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      REDIS_PASSWORD: null
      CACHE_DRIVER: redis
      SESSION_DRIVER: redis
      QUEUE_CONNECTION: redis
      HASHIDS_LENGTH: 8
      HASHIDS_SALT: ${HASHIDS_SALT}
      TRUSTED_PROXIES: "*"
      SKIP_SEED: "false"
    labels:
      - traefik.enable=true
      - traefik.http.routers.hydrodactyl.rule=Host(\`${PANEL_FQDN}\`)
      - traefik.http.routers.hydrodactyl.entrypoints=websecure
      - traefik.http.routers.hydrodactyl.tls=true
      - traefik.http.services.hydrodactyl.loadbalancer.server.port=80

  mariadb:
    image: mariadb:10.11
    restart: always
    networks:
      - dokploy-network
    volumes:
      - mariadb_data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: panel
      MYSQL_USER: hydrodactyl
      MYSQL_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - dokploy-network
    volumes:
      - redis_data:/data

volumes:
  panel_var:
  panel_storage:
  mariadb_data:
  redis_data:

networks:
  dokploy-network:
    external: true
EOF

  success "Docker Compose generated at $COMPOSE_DIR/docker-compose.yml"
}

generate_env() {
  local env_file="$COMPOSE_DIR/.env"

  cat > "$env_file" <<EOF
PANEL_REPO=${PANEL_REPO}
DOMAIN=${PANEL_FQDN}
APP_URL=https://${PANEL_FQDN}
APP_TIMEZONE=${PANEL_TIMEZONE}
DB_PASSWORD=${DB_PASSWORD}
DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
HASHIDS_SALT=${HASHIDS_SALT}
TRUSTED_PROXIES=*
EOF

  chmod 600 "$env_file"
  success "Environment file created at $env_file"
}

deploy_stack() {
  print_flame "Starting Docker Stack"

  cd "$COMPOSE_DIR"

  output "Pulling images..."
  docker pull ghcr.io/itzzmateo/hydrodactyl:${PANEL_VERSION}
  docker pull mariadb:10.11
  docker pull redis:7-alpine

  output "Starting services..."
  docker compose up -d

  output "Waiting for panel to be ready..."
  sleep 10

  success "Stack deployed. Run initial setup with:"
  echo ""
  output "  docker compose exec panel php artisan key:generate --force"
  output "  docker compose exec panel php artisan migrate --seed --force"
  output "  docker compose exec panel php artisan p:user:make \\"
  output "    --email=$PANEL_ADMIN_EMAIL --username=${PANEL_ADMIN_USERNAME:-admin} \\"
  output "    --name-first=${PANEL_ADMIN_FIRSTNAME:-Admin} --name-last=${PANEL_ADMIN_LASTNAME:-User} \\"
  output "    --password=${PANEL_ADMIN_PASSWORD:-password} --admin=1"
}

main() {
  print_header
  print_flame "Starting Hydrodactyl Panel Installation (Docker)"

  validate_configuration
  install_dependencies
  setup_directories
  generate_compose
  generate_env

  local deploy_now="n"
  bool_input deploy_now "Deploy the stack now?" "y"
  if [ "$deploy_now" == "y" ]; then
    deploy_stack
  else
    success "Files generated at $COMPOSE_DIR"
    output "Run 'docker compose up -d' in $COMPOSE_DIR to deploy"
  fi

  configure_firewall
  save_panel_install_info "docker"
  show_panel_completion "docker"
}

main "$@"
