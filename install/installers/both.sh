#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Pyrodactyl + Elytra Combined Installer                                             #
#                                                                                    #
# Installs both Panel and Elytra on the same machine with automatic configuration    #
#                                                                                    #
######################################################################################

# Check if lib is loaded, load if not or fail otherwise.
fn_exists() { declare -F "$1" >/dev/null; }
if ! fn_exists lib_loaded; then
  # Try temp file first (when run through install.sh)
  if [ -f /tmp/pyrodactyl-lib.sh ]; then
    # shellcheck source=/dev/null
    if ! source /tmp/pyrodactyl-lib.sh 2>/dev/null; then
      # Temp file exists but failed to load (corrupt/invalid) - remove it
      rm -f /tmp/pyrodactyl-lib.sh
    fi
  fi
  # Fall back to downloading if temp file didn't load or doesn't exist
  if ! fn_exists lib_loaded; then
    # shellcheck source=/dev/null
    source <(curl -sSL "${GITHUB_BASE_URL:-"https://raw.githubusercontent.com/Muspelheim-Hosting/pyrodactyl-installer"}/${GITHUB_SOURCE:-"main"}/lib/lib.sh")
  fi
  ! fn_exists lib_loaded && echo "* ERROR: Could not load lib script" && exit 1
fi

# ------------------ Variables ----------------- #

# Panel configuration
PANEL_REPO="${PANEL_REPO:-pyrodactyl-oss/pyrodactyl}"
PANEL_INSTALL_METHOD="${PANEL_INSTALL_METHOD:-release}"
PANEL_RELEASE_VERSION="${PANEL_RELEASE_VERSION:-latest}"
PANEL_FQDN="${PANEL_FQDN:-}"
PANEL_TIMEZONE="${PANEL_TIMEZONE:-UTC}"
PANEL_ADMIN_EMAIL="${PANEL_ADMIN_EMAIL:-}"
PANEL_ADMIN_USERNAME="${PANEL_ADMIN_USERNAME:-}"
PANEL_ADMIN_FIRSTNAME="${PANEL_ADMIN_FIRSTNAME:-}"
PANEL_ADMIN_LASTNAME="${PANEL_ADMIN_LASTNAME:-}"
PANEL_ADMIN_PASSWORD="${PANEL_ADMIN_PASSWORD:-$(gen_passwd 32)}"
ASSUME_SSL="${ASSUME_SSL:-false}"
CONFIGURE_LETSENCRYPT="${CONFIGURE_LETSENCRYPT:-false}"
SSL_CERT_PATH="${SSL_CERT_PATH:-}"
SSL_KEY_PATH="${SSL_KEY_PATH:-}"

# Database
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-panel}"
DB_USER="${DB_USER:-pyrodactyl}"

# Load existing credentials or generate new ones
if saved_pass=$(load_existing_db_credentials); then
  MYSQL_ROOT_PASSWORD="${saved_pass}"
else
  DB_PASSWORD="${DB_PASSWORD:-$(gen_passwd 64)}"
  MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-$(gen_passwd 64)}"
fi

# Elytra configuration
ELYTRA_REPO="${ELYTRA_REPO:-pyrohost/elytra}"
NODE_NAME="${NODE_NAME:-local}"
NODE_DESCRIPTION="${NODE_DESCRIPTION:-Local Node}"
NODE_TOKEN="${NODE_TOKEN:-$(gen_passwd 32)}"
BEHIND_PROXY="${BEHIND_PROXY:-false}"

# General
CONFIGURE_FIREWALL="${CONFIGURE_FIREWALL:-false}"
GAME_PORT_START="${GAME_PORT_START:-27015}"
GAME_PORT_END="${GAME_PORT_END:-28025}"
INSTALL_AUTO_UPDATER_PANEL="${INSTALL_AUTO_UPDATER_PANEL:-false}"
INSTALL_AUTO_UPDATER_ELYTRA="${INSTALL_AUTO_UPDATER_ELYTRA:-false}"

# GitHub
PANEL_REPO_PRIVATE="${PANEL_REPO_PRIVATE:-false}"
ELYTRA_REPO_PRIVATE="${ELYTRA_REPO_PRIVATE:-false}"
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Paths
INSTALL_DIR="${INSTALL_DIR:-/var/www/pyrodactyl}"
ELYTRA_DIR="${ELYTRA_DIR:-/etc/elytra}"
PANEL_CONFIG_DIR="${PANEL_CONFIG_DIR:-/etc/pyrodactyl}"

# Node ID (will be set during installation)
NODE_ID=""

# Validation
missing=()

for var in PANEL_FQDN PANEL_ADMIN_EMAIL PANEL_ADMIN_USERNAME PANEL_ADMIN_FIRSTNAME PANEL_ADMIN_LASTNAME; do
  if [[ -z "${!var}" ]]; then
    missing+=("$var")
  fi
done

validate_configuration() {
  print_flame "Validating Configuration"

  local missing=()

  [ -z "$PANEL_FQDN" ] && missing+=("PANEL_FQDN")
  [ -z "$PANEL_ADMIN_EMAIL" ] && missing+=("PANEL_ADMIN_EMAIL")
  [ -z "$PANEL_ADMIN_USERNAME" ] && missing+=("PANEL_ADMIN_USERNAME")
  [ -z "$PANEL_ADMIN_FIRSTNAME" ] && missing+=("PANEL_ADMIN_FIRSTNAME")
  [ -z "$PANEL_ADMIN_LASTNAME" ] && missing+=("PANEL_ADMIN_LASTNAME")

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

# Inline validation for backwards compatibility
if (( ${#missing[@]} > 0 )); then
  print_header
  print_flame "Missing Required Variables"
  for m in "${missing[@]}"; do
    error "${m} is required"
  done
  exit 1
fi

# Validate FQDN
if ! check_fqdn "$PANEL_FQDN"; then
  error "Invalid FQDN: $PANEL_FQDN"
  error "FQDN must be a domain name, not an IP address"
  exit 1
fi

# ---------------- Installation Functions ---------------- #

check_existing() {
  local has_existing=false

  if check_existing_installation "panel"; then
    has_existing=true
  fi

  if check_existing_installation "elytra"; then
    has_existing=true
  fi

  if [ "$has_existing" == true ]; then
    echo ""
    if ! bool_input "Continue with installation? This may overwrite existing files" "n"; then
      error "Installation aborted."
      exit 1
    fi

    # Stop services if they exist
    systemctl stop elytra 2>/dev/null || true
    systemctl stop pyroq 2>/dev/null || true
  fi
}

# ---------------- Panel Installation ---------------- #

install_panel_dependencies() {
  print_flame "Installing Panel Dependencies"

  update_repos true

  case "$OS" in
    ubuntu)
      output "Setting up Ubuntu repositories..."
      install_packages "software-properties-common apt-transport-https ca-certificates gnupg2"
      add-apt-repository universe -y
      LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php
      update_repos true
      install_packages "php${PHP_VERSION}-fpm php${PHP_VERSION}-cli php${PHP_VERSION}-gd php${PHP_VERSION}-mysql php${PHP_VERSION}-pdo php${PHP_VERSION}-mbstring php${PHP_VERSION}-tokenizer php${PHP_VERSION}-bcmath php${PHP_VERSION}-xml php${PHP_VERSION}-curl php${PHP_VERSION}-zip php${PHP_VERSION}-intl php${PHP_VERSION}-redis php${PHP_VERSION}-sqlite3"

      ensure_php_default
      ;;

    debian)
      output "Setting up Debian repositories..."
      install_packages "dirmngr ca-certificates apt-transport-https lsb-release"
      curl -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
      echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/php.list
      update_repos true
      install_packages "php${PHP_VERSION}-fpm php${PHP_VERSION}-cli php${PHP_VERSION}-gd php${PHP_VERSION}-mysql php${PHP_VERSION}-pdo php${PHP_VERSION}-mbstring php${PHP_VERSION}-tokenizer php${PHP_VERSION}-bcmath php${PHP_VERSION}-xml php${PHP_VERSION}-curl php${PHP_VERSION}-zip php${PHP_VERSION}-intl php${PHP_VERSION}-redis php${PHP_VERSION}-sqlite3"

      ensure_php_default
      ;;

    rocky|almalinux)
      output "Setting up RHEL repositories..."
      install_packages "epel-release"
      dnf install -y "https://rpms.remirepo.net/enterprise/remi-release-${OS_VER_MAJOR}.rpm"
      dnf module reset php -y
      dnf module enable php:remi-${PHP_VERSION} -y
      install_packages "php-fpm php-cli php-gd php-mysqlnd php-pdo php-mbstring php-tokenizer php-bcmath php-xml php-curl php-zip php-intl php-redis php-sqlite3"
      php_fpm_conf
      ;;
  esac

  # Install common packages
  install_packages "nginx mariadb-server redis-server curl tar unzip git certbot python3-certbot-nginx jq"

  success "Panel dependencies installed"
}

install_panel_release() {
  print_flame "Downloading Panel Release"

  # Ensure jq is installed for JSON parsing
  if ! cmd_exists jq; then
    output "Installing jq for JSON parsing..."
    install_packages "jq" true
  fi

  # Only require token for private repos
  if [ "$PANEL_REPO_PRIVATE" == "true" ] && [ -z "$GITHUB_TOKEN" ]; then
    error "GitHub token is required to download the panel from the private repository."
    error "Please provide a token using --github-token or set the GITHUB_TOKEN environment variable."
    exit 1
  fi

  # Determine which release to fetch
  local release_endpoint="latest"
  if [ "$PANEL_RELEASE_VERSION" != "latest" ]; then
    # URL-encode the version tag for the API path (handles special characters like +, spaces, etc.)
    local encoded_version
    encoded_version=$(printf '%s' "$PANEL_RELEASE_VERSION" | jq -sRr @uri 2>/dev/null || echo "$PANEL_RELEASE_VERSION")
    release_endpoint="tags/${encoded_version}"
    output "Fetching release ${PANEL_RELEASE_VERSION} from ${PANEL_REPO}..."
  else
    output "Fetching latest release from ${PANEL_REPO}..."
  fi

  # Build curl headers based on whether we have a token
  local curl_headers=(
    "--header" "Accept: application/vnd.github+json"
    "--header" "X-GitHub-Api-Version: 2022-11-28"
  )

  if [ -n "$GITHUB_TOKEN" ]; then
    curl_headers+=("--header" "Authorization: Bearer $GITHUB_TOKEN")
  fi

  # Get the release info from GitHub API
  local release_data
  release_data=$(curl -sS "${curl_headers[@]}" \
    "https://api.github.com/repos/${PANEL_REPO}/releases/${release_endpoint}")

  # Check if we got a valid response
  if echo "$release_data" | grep -q '"message"'; then
    error "Failed to fetch release data from ${PANEL_REPO}"
    error "API Response: $(echo "$release_data" | jq -r '.message' 2>/dev/null || echo "$release_data")"
    exit 1
  fi

  # Get the asset API URL
  local asset_api_url
  asset_api_url=$(echo "$release_data" | jq -r ".assets[] | select(.name == \"panel.tar.gz\") | .url")

  if [ -z "$asset_api_url" ] || [ "$asset_api_url" == "null" ]; then
    error "Could not find asset 'panel.tar.gz' in latest release"
    error "Available assets: $(echo "$release_data" | jq -r '.assets[].name' 2>/dev/null || echo "(failed to parse)")"
    exit 1
  fi

  local release_tag
  release_tag=$(echo "$release_data" | jq -r '.tag_name')
  info "Installing release: $release_tag"

  # Save version from GitHub release tag to persistent location
  output "Recording version from GitHub: $release_tag"
  mkdir -p /etc/pyrodactyl
  echo "$release_tag" > /etc/pyrodactyl/panel-version
  chmod 644 /etc/pyrodactyl/panel-version

  output "Creating installation directory..."
  mkdir -p "$INSTALL_DIR"
  cd "$INSTALL_DIR"

  output "Downloading panel.tar.gz..."

  # Build download headers - token optional for public repos
  local download_headers=(
    "--header" "Accept: application/octet-stream"
    "--header" "X-GitHub-Api-Version: 2022-11-28"
  )

  if [ -n "$GITHUB_TOKEN" ]; then
    download_headers+=("--header" "Authorization: Bearer $GITHUB_TOKEN")
  fi

  # Download using the asset API URL
  if ! curl --location --fail --silent --show-error "${download_headers[@]}" \
    --output panel.tar.gz \
    "$asset_api_url"; then
    error "Failed to download panel from repository"
    if [ "$PANEL_RELEASE_VERSION" != "latest" ]; then
      error "Release ${PANEL_RELEASE_VERSION} may not exist or the asset 'panel.tar.gz' is not available."
    fi
    if [ "$PANEL_REPO_PRIVATE" == "true" ]; then
      error "Please check that your GitHub token has 'repo' scope and the release exists."
    else
      error "Please check that the release exists and is accessible."
    fi
    exit 1
  fi

  output "Extracting files..."
  tar -xzf panel.tar.gz

  rm -f panel.tar.gz

  # Check if .env.example exists, if not download from repo
  if [ ! -f ".env.example" ]; then
    output ".env.example not found in release, downloading from repository..."
    local env_url="https://raw.githubusercontent.com/${PANEL_REPO}/main/.env.example"

    if [ -n "$GITHUB_TOKEN" ]; then
      curl -fsSL \
        --header "Authorization: Bearer $GITHUB_TOKEN" \
        --header "Accept: application/vnd.github.v3.raw" \
        -o .env.example \
        "$env_url" 2>/dev/null || warning "Failed to download .env.example from repository"
    else
      curl -fsSL -o .env.example "$env_url" 2>/dev/null || warning "Failed to download .env.example from repository"
    fi

    if [ ! -f ".env.example" ]; then
      error "Could not obtain .env.example file"
      error "The release package may be incomplete or the repository may be inaccessible"
      exit 1
    fi
  fi

  cp .env.example .env

  # Install composer and dependencies
  install_composer

  [ "$OS" == "rocky" ] || [ "$OS" == "almalinux" ] && export PATH=/usr/local/bin:$PATH

  output "Installing composer dependencies..."
  COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction

  # Build frontend assets
  build_panel_assets "$INSTALL_DIR"

  success "Panel downloaded to $INSTALL_DIR"
}

install_panel_clone() {
  print_flame "Cloning Panel Repository"

  if [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR")" ]; then
    error "Directory $INSTALL_DIR already exists and is not empty"
    exit 1
  fi

  mkdir -p "$(dirname "$INSTALL_DIR")"

  # Simple token-based auth: embed token in URL if provided
  local git_url="https://github.com/${PANEL_REPO}.git"
  [ -n "$GITHUB_TOKEN" ] && git_url="https://${GITHUB_TOKEN}@github.com/${PANEL_REPO}.git"

  output "Cloning from https://github.com/${PANEL_REPO}.git"
  if ! git clone "$git_url" "$INSTALL_DIR"; then
    error "Failed to clone repository"
    exit 1
  fi

  cd "$INSTALL_DIR"
  cp .env.example .env

  # Install composer and dependencies
  install_composer

  [ "$OS" == "rocky" ] || [ "$OS" == "almalinux" ] && export PATH=/usr/local/bin:$PATH

  output "Installing composer dependencies..."
  COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction

  # Build frontend assets
  build_panel_assets "$INSTALL_DIR"

  # Save commit hash for auto-updater tracking
  # Git installs use commit hash as version identifier
  local commit_hash
  commit_hash=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  output "Recording git commit hash: ${commit_hash:0:8}"
  mkdir -p /etc/pyrodactyl
  echo "git:${commit_hash}" > /etc/pyrodactyl/panel-version
  chmod 644 /etc/pyrodactyl/panel-version

  success "Panel cloned to $INSTALL_DIR"
}

configure_mariadb() {
  print_flame "Setting up MariaDB"

  output "Starting MariaDB service..."
  systemctl start mariadb
  systemctl enable mariadb

  # Check if MariaDB is accessible with current credentials
  if mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1; then
    output "MariaDB connection successful with existing credentials"
  # Check if MariaDB has no root password set (fresh install)
  elif mysql -u root -e "SELECT 1" >/dev/null 2>&1; then
    output "Securing MariaDB with new credentials..."
    # Try to set root password (may fail if already secured differently)
    mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';" 2>/dev/null || true

    # Verify the new password works
    if ! mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "SELECT 1" >/dev/null 2>&1; then
      error "Failed to set MariaDB root password"
      exit 1
    fi

    # Remove anonymous users and test database

    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='';" 2>/dev/null || true
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');" 2>/dev/null || true
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DROP DATABASE IF EXISTS test;" 2>/dev/null || true
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';" 2>/dev/null || true
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;" 2>/dev/null || true
else
    # Cannot connect - MariaDB is secured with unknown password
    error "Cannot connect to MariaDB"
    error "MariaDB appears to be secured with a password that doesn't match our records"
    error "Please either:"
    error "  1. Set MYSQL_ROOT_PASSWORD environment variable to the correct password"
    error "  2. Reset MariaDB root password manually"
    error "  3. Remove /root/.config/pyrodactyl/db-credentials if you want to start fresh"
    exit 1
  fi

  # Save credentials
  mkdir -p /root/.config/pyrodactyl
  echo "root:${MYSQL_ROOT_PASSWORD}" > /root/.config/pyrodactyl/db-credentials
  chmod 600 /root/.config/pyrodactyl/db-credentials

  # Create panel database and user
  output "Creating panel database..."
  mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME};" 2>/dev/null || true

  # Check if user exists, create or update password
  local user_exists
  user_exists=$(mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -N -B -e "SELECT COUNT(*) FROM mysql.user WHERE user='${DB_USER}' AND host='${DB_HOST}';" 2>/dev/null || echo "0")

  if [ "$user_exists" == "0" ]; then
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "CREATE USER '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';" 2>/dev/null || true
  else
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "ALTER USER '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';" 2>/dev/null || true
  fi

  mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'${DB_HOST}';" 2>/dev/null || true
  mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "FLUSH PRIVILEGES;" 2>/dev/null || true

  success "MariaDB configured"
}

configure_panel_environment() {
  print_flame "Configuring Panel Environment"

  cd "$INSTALL_DIR"

  # Generate application key
  output "Generating application key..."
  php artisan key:generate --force

  # Determine app URL
  local app_url="http://$PANEL_FQDN"
  [ "$ASSUME_SSL" == true ] && app_url="https://$PANEL_FQDN"
  [ "$CONFIGURE_LETSENCRYPT" == true ] && app_url="https://$PANEL_FQDN"

  # Setup environment using artisan commands
  output "Configuring environment..."
  php artisan p:environment:setup -n \
    --author="$PANEL_ADMIN_EMAIL" \
    --url="$app_url" \
    --timezone="$PANEL_TIMEZONE" \
    --cache="redis" \
    --session="redis" \
    --queue="redis" \
    --redis-host="localhost" \
    --redis-pass="null" \
    --redis-port="6379" \
    --settings-ui=true </dev/null

  # Configure database
  output "Configuring database..."
  php artisan p:environment:database -n \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --database="$DB_NAME" \
    --username="$DB_USER" \
    --password="$DB_PASSWORD" </dev/null

  # Run migrations
  output "Running database migrations..."
  php artisan migrate --seed --force </dev/null

  # Create admin user
  output "Creating admin user..."
  php artisan p:user:make -n \
    --email="$PANEL_ADMIN_EMAIL" \
    --username="$PANEL_ADMIN_USERNAME" \
    --name-first="$PANEL_ADMIN_FIRSTNAME" \
    --name-last="$PANEL_ADMIN_LASTNAME" \
    --password="$PANEL_ADMIN_PASSWORD" \
    --admin=1 </dev/null

  success "Environment configured"
}

setup_panel_services() {
  print_flame "Setting up Panel Services"

  # Set permissions
  output "Setting ownership to $WEBUSER:$WEBGROUP..."
  chown -R "$WEBUSER":"$WEBGROUP" "$INSTALL_DIR"

  # Apply correct permissions: 755 for directories, 644 for files
  if [ -d "$INSTALL_DIR/storage" ]; then
    find "$INSTALL_DIR/storage" -type d -exec chmod 755 {} \; 2>/dev/null || true
    find "$INSTALL_DIR/storage" -type f -exec chmod 644 {} \; 2>/dev/null || true
  fi
  if [ -d "$INSTALL_DIR/bootstrap/cache" ]; then
    find "$INSTALL_DIR/bootstrap/cache" -type d -exec chmod 755 {} \; 2>/dev/null || true
    find "$INSTALL_DIR/bootstrap/cache" -type f -exec chmod 644 {} \; 2>/dev/null || true
  fi

  # Enable Redis
  enable_redis

  # Enable nginx
  systemctl enable nginx

  # Enable MariaDB
  systemctl enable mariadb

  # SELinux configuration for RHEL
  selinux_allow

  # Install nginx config
  local php_socket
  php_socket=$(get_php_socket)

  local use_ssl=false
  [ -n "$SSL_CERT_PATH" ] && [ -n "$SSL_KEY_PATH" ] && use_ssl=true

  install_nginx_config "$PANEL_FQDN" "$php_socket" "$use_ssl" "$SSL_CERT_PATH" "$SSL_KEY_PATH"

  # Setup SSL if requested
  if [ "$CONFIGURE_LETSENCRYPT" == true ]; then
    install_letsencrypt "$PANEL_FQDN" "$PANEL_ADMIN_EMAIL"
  fi

  # Setup cron
  insert_cronjob

  # Install queue worker
  install_pyroq

  success "Panel services configured"
}

# ---------------- Node Creation ---------------- #

create_node_in_panel() {
  print_flame "Creating Node in Panel via API"

  # Check if we have API key for API-based creation
  if [ -n "$PANEL_API_KEY" ] && [ -n "$PANEL_FQDN" ]; then
    local panel_url="https://${PANEL_FQDN}"

    # Step 1: Detect country and get/create location
    output "Detecting server location..."
    local country_code
    country_code=$(get_server_country_code)
    info "Detected country code: ${COLOR_ORANGE}${country_code}${COLOR_NC}"

    local location_id
    if ! location_id=$(get_or_create_location "$PANEL_API_KEY" "$panel_url" "$country_code"); then
      error "Failed to set up location via API, falling back to manual method"
      # Fall through to manual method below
    else
      # Step 2: Create node via API
      output "Creating node via API: ${COLOR_ORANGE}${NODE_NAME}${COLOR_NC}" >&2
      local memory_mb
      local disk_mb
      memory_mb=$(get_system_memory)
      disk_mb=$(df -m / | awk 'NR==2 {print $2}')

      if ! NODE_ID=$(create_node_via_api "$PANEL_API_KEY" "$panel_url" "$location_id" "$NODE_NAME" "$memory_mb" "$disk_mb" "$BEHIND_PROXY" "$PANEL_FQDN"); then
        error "Failed to create node via API, falling back to manual method"
        # Fall through to manual method below
      else
        output "DEBUG: Node created via API with NODE_ID=${NODE_ID}"
        success "Node created successfully via API"
        info "Node ID: ${NODE_ID}"
        return 0
      fi
    fi
  fi

  # Fallback: Manual creation using artisan/MySQL
  output "Using manual node creation method..."
  cd "$INSTALL_DIR"

  # Detect system specs
  output "Detecting system specifications..."
  local system_memory
  local system_disk
  system_memory=$(get_system_memory)
  system_disk=$(df -m / | awk 'NR==2 {print $2}')

  # Use detected values or defaults if detection failed
  local max_memory="${system_memory:-8192}"
  local max_disk="${system_disk:-32768}"

  info "Detected Memory: ${max_memory} MB"
  info "Detected Disk: ${max_disk} MB"

  # Create location first
  output "Creating location..."
  php artisan p:location:make -n --short=local --long="Local Location" 2>/dev/null || true

  # Get location ID
  local location_id
  location_id=$(mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -D panel -N -B -e "SELECT id FROM locations WHERE short='local' LIMIT 1;" 2>/dev/null || echo "1")

  # Create node with actual system specs
  output "Creating node: $NODE_NAME..."
  php artisan p:node:make -n \
    --name="$NODE_NAME" \
    --description="$NODE_DESCRIPTION" \
    --locationId="$location_id" \
    --fqdn="$PANEL_FQDN" \
    --public=1 \
    --scheme=https \
    --proxy=$([ "$BEHIND_PROXY" == "true" ] && echo "yes" || echo "no") \
    --maxMemory="$max_memory" \
    --overallocateMemory=0 \
    --maxDisk="$max_disk" \
    --overallocateDisk=0 \
    --uploadSize=100 </dev/null 2>/dev/null || true

  # Get the node ID
  NODE_ID=$(mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -D panel -N -B -e "SELECT id FROM nodes WHERE name='${NODE_NAME}' LIMIT 1;" 2>/dev/null || echo "1")

  if [ -z "$NODE_ID" ] || [ "$NODE_ID" == "NULL" ]; then
    NODE_ID="1"
  fi

  output "Node ID: $NODE_ID"

  success "Node created in panel (ID: ${NODE_ID})"
}

# ---------------- Elytra Installation ---------------- #

install_elytra_daemon() {
  print_flame "Installing Elytra Daemon"

  # Install Docker using shared function from lib.sh
  install_docker

  # Create directories
  mkdir -p "$ELYTRA_DIR"
  mkdir -p "$PANEL_CONFIG_DIR"
  mkdir -p /var/lib/elytra/volumes
  mkdir -p /var/lib/elytra/archives
  mkdir -p /var/lib/elytra/backups

  # Create pyrodactyl group first (required for user creation)
  output "Creating pyrodactyl system group..."
  if ! getent group pyrodactyl >/dev/null 2>&1; then
    groupadd --gid 8888 pyrodactyl 2>/dev/null || true
  fi

  # Create pyrodactyl user for Elytra (UID/GID 8888) if it doesn't exist
  output "Creating pyrodactyl system user..."
  if ! id -u pyrodactyl >/dev/null 2>&1; then
    useradd --system --no-create-home --shell /usr/sbin/nologin --uid 8888 --gid 8888 pyrodactyl 2>/dev/null || \
    useradd --system --no-create-home --shell /sbin/nologin --uid 8888 pyrodactyl 2>/dev/null || \
    useradd --system --no-create-home --shell /bin/false --uid 8888 pyrodactyl
  fi

  # Add pyrodactyl user to docker group for container management
  if getent group docker >/dev/null 2>&1; then
    output "Adding pyrodactyl user to docker group..."
    usermod -aG docker pyrodactyl 2>/dev/null || true
  fi

  # Determine architecture
  local arch
  arch=$(uname -m)
  [[ $arch == x86_64 ]] && arch=amd64 || arch=arm64

  local asset_name="elytra_linux_${arch}"

  # Get latest release
  output "Fetching latest Elytra release..."
  local latest_release
  latest_release=$(get_latest_release "$ELYTRA_REPO" "$GITHUB_TOKEN")

  if [ -z "$latest_release" ] || [ "$latest_release" == "null" ]; then
    error "Could not fetch latest release from $ELYTRA_REPO"
    exit 1
  fi

  info "Latest release: $latest_release"

  # Download binary
  output "Downloading Elytra binary..."
  if ! download_release_asset "$ELYTRA_REPO" "$asset_name" "/usr/local/bin/elytra" "$GITHUB_TOKEN"; then
    error "Failed to download Elytra binary"
    exit 1
  fi

  chmod +x /usr/local/bin/elytra

  # Save version from GitHub release tag for auto-updater tracking
  mkdir -p /etc/pyrodactyl
  echo "$latest_release" > /etc/pyrodactyl/elytra-version
  chmod 644 /etc/pyrodactyl/elytra-version

  # Create Elytra config directory
  output "Creating Elytra config directory at ${ELYTRA_DIR}..."
  mkdir -p "${ELYTRA_DIR}"
  if [ ! -d "${ELYTRA_DIR}" ]; then
    error "Failed to create Elytra config directory at ${ELYTRA_DIR}"
    exit 1
  fi

  # Determine panel URL - always use HTTPS for API
  local panel_url="https://${PANEL_FQDN}"

  # Debug output
  output "DEBUG: Elytra configuration values:"
  output "DEBUG: NODE_ID=${NODE_ID}"
  output "DEBUG: PANEL_FQDN=${PANEL_FQDN}"
  output "DEBUG: ELYTRA_DIR=${ELYTRA_DIR}"

  # Configure Elytra using the official configure command
  output "Configuring Elytra using 'elytra configure' command..."
  cd "${ELYTRA_DIR}" && elytra configure --panel-url "${panel_url}" --token "${PANEL_API_KEY}" --node "${NODE_ID}"

  if [ $? -ne 0 ]; then
    error "Failed to configure Elytra"
    exit 1
  fi

  output "DEBUG: Elytra configured successfully"

  # Disable permission checking to prevent Elytra from resetting permissions
  output "Disabling permission checks in Elytra config..."
  sed -i 's/check_permissions_on_boot: true/check_permissions_on_boot: false/' "${ELYTRA_DIR}/config.yml" 2>/dev/null || true

  # Update container limits for better game server compatibility
  output "Updating container limits in Elytra config..."
  sed -i 's/container_pid_limit: 512/container_pid_limit: 2048/' "${ELYTRA_DIR}/config.yml" 2>/dev/null || true
  # Update installer_limits memory and cpu values
  sed -i 's/memory: 1024/memory: 2048/' "${ELYTRA_DIR}/config.yml" 2>/dev/null || true
  sed -i 's/cpu: 100/cpu: 200/' "${ELYTRA_DIR}/config.yml" 2>/dev/null || true

  # Configure SSL for Elytra using Let's Encrypt certificates
  output "Configuring SSL for Elytra..."
  if [ -f "/etc/letsencrypt/live/${PANEL_FQDN}/fullchain.pem" ] && [ -f "/etc/letsencrypt/live/${PANEL_FQDN}/privkey.pem" ]; then
    # Enable SSL and set certificate paths
    sed -i 's/enabled: false/enabled: true/' "${ELYTRA_DIR}/config.yml"
    sed -i "s|certificate: .*|certificate: /etc/letsencrypt/live/${PANEL_FQDN}/fullchain.pem|" "${ELYTRA_DIR}/config.yml"
    sed -i "s|key: .*|key: /etc/letsencrypt/live/${PANEL_FQDN}/privkey.pem|" "${ELYTRA_DIR}/config.yml"
    success "SSL configured for Elytra using Let's Encrypt certificates"
  else
    warning "Let's Encrypt certificates not found, SSL may need manual configuration"
  fi

  # Step 4: Create allocations via API (after Elytra configure)
  output "Creating allocations via API..."
  create_node_allocations "$PANEL_API_KEY" "$panel_url" "$NODE_ID" "$GAME_PORT_START" "$GAME_PORT_END" || true

  # Install rustic using shared function from lib.sh
  install_rustic

  # Get systemd service
  output "Setting up Elytra service..."
  if ! get_config "elytra.service" "/etc/systemd/system/elytra.service"; then
    error "Failed to get Elytra service file"
    exit 1
  fi

  systemctl daemon-reload
  systemctl enable elytra
  systemctl restart elytra

  # Wait for service to start
  sleep 3

  if systemctl is-active --quiet elytra; then
    success "Elytra is running"
  else
    warning "Elytra service may not have started properly"
  fi

  # Set proper ownership and permissions on Elytra data directories (after service starts)
  output "Ensuring Elytra data directories exist..."
  mkdir -p /var/lib/elytra/volumes /var/lib/elytra/archives /var/lib/elytra/backups

  output "Setting final permissions on Elytra data directories..."
  chown -R 8888:8888 /var/lib/elytra/volumes /var/lib/elytra/archives /var/lib/elytra/backups "$ELYTRA_DIR" 2>/dev/null || true

  # Set full permissions so containers can read/write/execute
  # Note: 777 is required for containerized game servers to access these directories
  # Ensure parent /var/lib/elytra is accessible
  chmod 755 /var/lib/elytra 2>/dev/null || true
  # Ensure the volumes directory itself and all contents have 777
  chmod 777 /var/lib/elytra/volumes 2>/dev/null || true
  chmod -R 777 /var/lib/elytra/volumes/* 2>/dev/null || true
  chmod 777 /var/lib/elytra/archives 2>/dev/null || true
  chmod -R 777 /var/lib/elytra/archives/* 2>/dev/null || true
  chmod 777 /var/lib/elytra/backups 2>/dev/null || true
  chmod -R 777 /var/lib/elytra/backups/* 2>/dev/null || true
  chmod -R 755 "$ELYTRA_DIR" 2>/dev/null || true
  [ -f "$ELYTRA_DIR/config.yml" ] && chmod 600 "$ELYTRA_DIR/config.yml" 2>/dev/null || true

  # Disable check_permissions_on_boot to prevent Elytra from resetting permissions
  if [ -f "$ELYTRA_DIR/config.yml" ]; then
    output "Disabling permission checks in Elytra config..."
    sed -i 's/check_permissions_on_boot: true/check_permissions_on_boot: false/' "$ELYTRA_DIR/config.yml" 2>/dev/null || true
  fi

  # Run auto-fix to ensure proper permissions (fixes container access issues)
  output "Running Elytra permission fix..."
  auto_fix_elytra_issues || true

  success "Elytra installed and started"
}

# ---------------- Final Configuration ---------------- #

configure_firewall() {
  if [ "$CONFIGURE_FIREWALL" == true ]; then
    print_flame "Configuring Firewall"

    install_firewall

    output "Opening ports for panel and game servers..."
    output "  • 22 (SSH)"
    output "  • 80, 443 (HTTP/HTTPS)"
    output "  • 8080 (Elytra API)"
    output "  • 2022 (SFTP)"
    output "  • 25565-25665 (Minecraft)"
    output "  • 27015-27150 (Source Engine - CS:GO, TF2, GMod)"
    output "  • 7777-8000 (Unreal Engine - ARK, Satisfactory)"
    output "  • 28015-28025 (Rust)"
    output "  • 2456-2466 (Valheim)"
    output "  • 30120-30130 (FiveM/GTA)"
    output "  • ${GAME_PORT_START}-${GAME_PORT_END} (Additional range)"

    # Note: Port 3306 (MySQL/MariaDB) is only needed if Wings nodes are on different servers
    # Port 8081 is for phpMyAdmin access
    local ports="22 80 443 8080 2022 3306 8081"
    ports="$ports 25565:25665 27015:27150 7777:8000 28015:28025 2456:2466 30120:30130"
    ports="$ports ${GAME_PORT_START}:${GAME_PORT_END}"

    # Allow SSH
    case "$OS" in
      ubuntu|debian)
        ufw allow ssh
        ;;
      rocky|almalinux)
        firewall-cmd --permanent --add-service=ssh
        ;;
    esac

    firewall_allow_ports "$ports"
    success "Firewall configured"
  fi
}

install_auto_updaters() {
  if [ "$INSTALL_AUTO_UPDATER_PANEL" == true ]; then
    print_flame "Installing Panel Auto-Updater"
    export PANEL_REPO
    export PANEL_REPO_PRIVATE
    export GITHUB_TOKEN
    install_auto_updater_panel
  fi

  if [ "$INSTALL_AUTO_UPDATER_ELYTRA" == true ]; then
    print_flame "Installing Elytra Auto-Updater"
    export ELYTRA_REPO
    export ELYTRA_REPO_PRIVATE
    export GITHUB_TOKEN
    install_auto_updater_elytra
  fi
}

# ---------------- Main ---------------- #

main() {
  print_header
  print_flame "Starting Combined Installation"
  output "This will install Pyrodactyl Panel and Elytra on the same machine."
  echo ""

  validate_configuration

  check_existing

  # Panel installation
  install_panel_dependencies
  configure_mariadb

  if [ "$PANEL_INSTALL_METHOD" == "release" ]; then
    install_panel_release
  else
    install_panel_clone
  fi


  configure_panel_environment
  setup_panel_services
  install_phpmyadmin

  # Generate API key for automated operations
  output "Generating Application API Key..."
  PANEL_API_KEY=$(generate_api_key "$INSTALL_DIR" || echo "")
  if [ -n "$PANEL_API_KEY" ]; then
    success "API Key generated successfully"
    # Save API key to credentials file for later use
    mkdir -p /root/.config/pyrodactyl
    echo "api_key:${PANEL_API_KEY}" >> /root/.config/pyrodactyl/db-credentials
    chmod 600 /root/.config/pyrodactyl/db-credentials
  else
    warning "Failed to generate API key - automated server creation will be skipped"
  fi

  # Create node in panel (uses API key if available)
  create_node_in_panel

  # Configure MariaDB for TCP connections
  configure_mariadb_tcp

  # Setup database host for the panel
  setup_database_host "$PANEL_FQDN"

  # Elytra installation
  install_elytra_daemon

  # Create Minecraft server if requested and API key is available
  if [ "$CREATE_MINECRAFT_SERVER" == "true" ] && [ -n "$PANEL_API_KEY" ]; then
    print_flame "Creating Minecraft Server"

    # Get the first allocation for this node
    ALLOCATION_ID=$(mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -D panel -N -B -e "SELECT id FROM allocations WHERE node_id=${NODE_ID} LIMIT 1;" 2>/dev/null || echo "")

    if [ -n "$ALLOCATION_ID" ]; then
      # Determine panel URL - always use HTTPS for API
      PANEL_URL="https://${PANEL_FQDN}"

      # Create the server
      if create_minecraft_server "$PANEL_URL" "$PANEL_API_KEY" "$NODE_ID" "$LOCATION_ID" "$ALLOCATION_ID"; then
        CREATED_SERVER_ID=$CREATED_SERVER_ID
        CREATED_SERVER_UUID=$CREATED_SERVER_UUID
        success "Minecraft server created successfully"
      else
        warning "Failed to create Minecraft server automatically"
      fi
    else
      warning "No allocations found for node, skipping server creation"
    fi
  fi

  # Firewall
  configure_firewall

  # Auto-updaters
  install_auto_updaters

  # Pause to let user review logs before showing completion screen
  echo ""
  output "Installation finished, press Enter to view details..."
  read -r

  print_header
  print_flame "Installation Complete!"

  echo ""
  output "🎉 Pyrodactyl Panel and Elytra have been successfully installed!"
  echo ""
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "  Panel Information"
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "Panel URL:      ${COLOR_ORANGE}https://${PANEL_FQDN}${COLOR_NC}"
  output "Admin Email:    ${COLOR_ORANGE}${PANEL_ADMIN_EMAIL}${COLOR_NC}"
  output "Admin Username: ${COLOR_ORANGE}${PANEL_ADMIN_USERNAME}${COLOR_NC}"
  output "Admin Password: ${COLOR_ORANGE}${PANEL_ADMIN_PASSWORD}${COLOR_NC}"
  echo ""
  if [ -n "$PANEL_API_KEY" ]; then
    output "API Key:        ${COLOR_ORANGE}${PANEL_API_KEY}${COLOR_NC}"
    echo ""
  fi
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "  phpMyAdmin Database Access"
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "URL:      ${COLOR_ORANGE}http://${PANEL_FQDN}:8081${COLOR_NC}"
  output "Username: ${COLOR_ORANGE}phpmyadmin${COLOR_NC}"
  output "Password: ${COLOR_ORANGE}${PHPMYADMIN_PASSWORD}${COLOR_NC}"
  output "Alternative Logins:"
  output "  - root / ${MYSQL_ROOT_PASSWORD}"
  output "  - ${DB_USER} / ${DB_PASSWORD}"
  echo ""
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "  Node & Database Host Information"
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "Node Name:        ${COLOR_ORANGE}${NODE_NAME}${COLOR_NC}"
  output "Node ID:          ${COLOR_ORANGE}${NODE_ID}${COLOR_NC}"
  output "Node Description: ${COLOR_ORANGE}${NODE_DESCRIPTION}${COLOR_NC}"
  output "Database Host:    ${COLOR_ORANGE}${PANEL_FQDN}:3306${COLOR_NC}"
  output "Database User:    ${COLOR_ORANGE}dbhost${COLOR_NC}"
  echo ""
  if [ -n "$CREATED_SERVER_ID" ]; then
    output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    output "  Created Minecraft Server"
    output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    output "Server ID:    ${COLOR_ORANGE}${CREATED_SERVER_ID}${COLOR_NC}"
    output "Server UUID:  ${COLOR_ORANGE}${CREATED_SERVER_UUID}${COLOR_NC}"
    output "Name:         ${COLOR_ORANGE}Minecraft Vanilla Server${COLOR_NC}"
    echo ""
  fi
  output "Game Server Ports Configured (TCP & UDP):"
  output "  • 25565-25665: Minecraft"
  output "  • 27015-27150: Source Engine (CS:GO, TF2, GMod)"
  output "  • 7777-8000: Unreal Engine (ARK, Satisfactory)"
  output "  • 28015-28025: Rust"
  output "  • 2456-2466: Valheim"
  output "  • 30120-30130: FiveM/GTA"
  output "  • ${GAME_PORT_START}-${GAME_PORT_END}: General range"
  echo ""
  output "Both components are configured to work together on this machine!"
  echo ""

  if [ "$INSTALL_AUTO_UPDATER_PANEL" == true ] || [ "$INSTALL_AUTO_UPDATER_ELYTRA" == true ]; then
    output "✅ Auto-updaters are enabled and will check for updates hourly."
    echo ""
  fi

  output "Service Commands:"
  output "  ${COLOR_ORANGE}systemctl status pyroq${COLOR_NC}    - Panel queue worker"
  output "  ${COLOR_ORANGE}systemctl status elytra${COLOR_NC}    - Elytra daemon"
  output "  ${COLOR_ORANGE}journalctl -u elytra -f${COLOR_NC}   - View Elytra logs"
  echo ""

  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "  Manual Reconfiguration"
  output "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  output "If you need to reconfigure Elytra manually, run:"
  output ""
  output "  ${COLOR_ORANGE}cd /etc/elytra && sudo elytra configure \\"
  output "    --panel-url 'https://${PANEL_FQDN}' \\"
  output "    --token '<your-api-key>' \\"
  output "    --node '${NODE_ID}'${COLOR_NC}"
  output ""
  output "Or use the installer function (if running the installer):"
  output "  ${COLOR_ORANGE}configure_elytra 'https://${PANEL_FQDN}' '<api-key>' '${NODE_ID}'${COLOR_NC}"
  echo ""

  print_brake 70

  # Map variables and save panel installation information
  FQDN="$PANEL_FQDN"
  MYSQL_DB="$DB_NAME"
  MYSQL_USER="$DB_USER"
  MYSQL_PASSWORD="$DB_PASSWORD"
  timezone="$PANEL_TIMEZONE"
  email="$PANEL_ADMIN_EMAIL"
  user_email="$PANEL_ADMIN_EMAIL"
  user_username="$PANEL_ADMIN_USERNAME"
  user_firstname="$PANEL_ADMIN_FIRSTNAME"
  user_lastname="$PANEL_ADMIN_LASTNAME"
  user_password="$PANEL_ADMIN_PASSWORD"
  save_panel_install_info "install"

  # Save Elytra installation information
  save_elytra_install_info "install"

  # Show completion screen
  show_both_completion

  # Run health checks
  echo ""
  output "Running post-installation health checks..."
  check_both_health
}

main
