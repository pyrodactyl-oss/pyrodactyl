 ```
pyrodactyl\install-scripts\new\ui\panel.sh
```
#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Pyrodactyl Panel Installation UI                                                   #
#                                                                                    #
# Copyright (C) 2025, Muspelheim Hosting                                             #
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

# ------------------ Configuration Variables ----------------- #

PANEL_REPO=""
PANEL_REPO_PRIVATE=false
GITHUB_TOKEN=""
PANEL_INSTALL_METHOD="release"
PANEL_RELEASE_VERSION="${PANEL_RELEASE_VERSION:-latest}"
PANEL_FQDN=""
PANEL_TIMEZONE="UTC"
PANEL_ADMIN_EMAIL=""
PANEL_ADMIN_USERNAME=""
PANEL_ADMIN_FIRSTNAME=""
PANEL_ADMIN_LASTNAME=""
PANEL_ADMIN_PASSWORD=""
CONFIGURE_LETSENCRYPT=false
CONFIGURE_FIREWALL=false
INSTALL_AUTO_UPDATER=false
SSL_CERT_PATH=""
SSL_KEY_PATH=""
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_NAME="panel"
DB_USER="pyrodactyl"
DB_PASSWORD=""

# ------------------ Repository Configuration ----------------- #

configure_github_repository() {
  print_header
  print_flame "GitHub Repository Configuration"

  output "The default Pyrodactyl Panel repository is:"
  output "  ${COLOR_ORANGE}${DEFAULT_PANEL_REPO}${COLOR_NC}"
  echo ""

  local use_default=""
  bool_input use_default "Use default repository?" "y"

  if [ "$use_default" == "y" ]; then
    PANEL_REPO="$DEFAULT_PANEL_REPO"
  else
    required_input PANEL_REPO "Enter the GitHub repository (format: owner/repo): " "Repository cannot be empty"

    if [[ ! "$PANEL_REPO" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]; then
      error "Invalid repository format. Must be 'owner/repo'"
      exit 1
    fi
  fi

  echo ""
  output "Repository: ${COLOR_ORANGE}${PANEL_REPO}${COLOR_NC}"

  # Only ask about private repo if not using default (default is public)
  if [ "$use_default" == "n" ]; then
    local is_private=""
    bool_input is_private "Is this a private repository?" "n"
    PANEL_REPO_PRIVATE=$([ "$is_private" == "y" ] && echo "true" || echo "false")

    if [ "$PANEL_REPO_PRIVATE" == "true" ]; then
      echo ""
      output "A GitHub Personal Access Token is required for private repositories."
      output "Create one at: $(hyperlink "https://github.com/settings/tokens")"
      output "Required scopes: ${COLOR_ORANGE}repo${COLOR_NC}"
      echo ""

      local token_valid=false
      while [ "$token_valid" == false ]; do
        password_input GITHUB_TOKEN "Enter your GitHub token: " "Token cannot be empty"

        output "Validating token..."
        if validate_github_token "$GITHUB_TOKEN" "$PANEL_REPO"; then
          success "Token validated successfully"
          token_valid=true
        else
          warning "Token validation failed. Please check your token and try again."
        fi
      done
    fi
  else
    PANEL_REPO_PRIVATE="false"
  fi

  output "Checking for releases in repository..."
  if ! check_releases_exist "$PANEL_REPO" "$GITHUB_TOKEN"; then
    echo ""
    error "No releases found in repository: ${PANEL_REPO}"
    warning "You must publish a release before using this installer."
    exit 1
  fi

  local latest_release
  latest_release=$(get_latest_release "$PANEL_REPO" "$GITHUB_TOKEN")
  success "Found releases in repository (latest: ${latest_release})"
}

# ------------------ Release Version Selection ----------------- #

configure_release_version() {
  print_header
  print_flame "Release Version Selection"

  local selected_version
  selected_version=$(select_release_version "$PANEL_REPO" "panel" "$GITHUB_TOKEN")

  if [ -z "$selected_version" ]; then
    error "Failed to select release version"
    exit 1
  fi

  PANEL_RELEASE_VERSION="$selected_version"

  if [ "$PANEL_RELEASE_VERSION" == "latest" ]; then
    local latest
    latest=$(get_latest_release "$PANEL_REPO" "$GITHUB_TOKEN")
    success "Will install latest release: ${latest}"
  else
    success "Will install release: ${PANEL_RELEASE_VERSION}"
  fi
}

# ------------------ Installation Method ----------------- #

configure_installation_method() {
  print_header
  print_flame "Installation Method"

  output "How would you like to install the panel?"
  echo ""
  output "[${COLOR_ORANGE}0${COLOR_NC}] Download latest release tarball (recommended)"
  output "[${COLOR_ORANGE}1${COLOR_NC}] Clone from Git repository (development)"
  echo ""

  local method_choice=""
  while [[ "$method_choice" != "0" && "$method_choice" != "1" ]]; do
    echo -n "* Select [0-1]: "
    read -r method_choice
  done

  if [ "$method_choice" == "0" ]; then
    PANEL_INSTALL_METHOD="release"
    output "Will download release tarball"
    # Configure which release version to use
    configure_release_version
  else
    PANEL_INSTALL_METHOD="clone"
    output "Will clone from Git repository"
  fi
}

# ------------------ Domain Configuration ----------------- #

configure_fqdn() {
  print_header
  print_flame "Domain Configuration"

  output "Please enter the domain or subdomain for your panel."
  output "Example: ${COLOR_ORANGE}panel.example.com${COLOR_NC}"
  echo ""

  local valid_fqdn=false
  while [ "$valid_fqdn" == false ]; do
    required_input PANEL_FQDN "Domain/Subdomain: " "Domain is required"

    if check_fqdn "$PANEL_FQDN"; then
      # Verify DNS resolution
      output "Verifying DNS for ${PANEL_FQDN}..."
      local verify_result=1
      bash <(curl -sSL "$GITHUB_URL/lib/verify-fqdn.sh") "$PANEL_FQDN" && verify_result=0

      if [ $verify_result -eq 0 ]; then
        valid_fqdn=true
      else
        # DNS verification failed and user chose not to continue
        error "Please fix your DNS configuration or enter a different domain."
      fi
    else
      error "Invalid FQDN format. Must be a valid domain name (not IP address)."
    fi
  done

  output "Domain set to: ${COLOR_ORANGE}${PANEL_FQDN}${COLOR_NC}"
}

# ------------------ SSL Configuration ----------------- #

configure_ssl() {
  print_header
  print_flame "SSL/TLS Configuration"

  local use_ssl=""
  bool_input use_ssl "Would you like to use SSL/HTTPS?" "y"

  if [ "$use_ssl" == "y" ]; then
    echo ""
    output "[${COLOR_ORANGE}0${COLOR_NC}] Let's Encrypt (auto-generated, requires domain to point to this server)"
    output "[${COLOR_ORANGE}1${COLOR_NC}] Use existing SSL certificate"
    output "[${COLOR_ORANGE}2${COLOR_NC}] No SSL (not recommended for production)"
    echo ""

    local ssl_choice=""
    while [[ "$ssl_choice" != "0" && "$ssl_choice" != "1" && "$ssl_choice" != "2" ]]; do
      echo -n "* Select [0-2]: "
      read -r ssl_choice
    done

    case "$ssl_choice" in
      0)
        CONFIGURE_LETSENCRYPT=true
        output "Will use Let's Encrypt for SSL"
        ;;
      1)
        required_input SSL_CERT_PATH "Path to SSL certificate: " "Path is required"
        required_input SSL_KEY_PATH "Path to SSL key: " "Path is required"
        output "Will use existing SSL certificate"
        ;;
      2)
        output "SSL will not be configured"
        ;;
    esac
  fi
}

# ------------------ Database Configuration ----------------- #

configure_database() {
  print_header
  print_flame "Database Configuration"

  local use_local_db=""
  bool_input use_local_db "Use local database?" "y"

  if [ "$use_local_db" == "n" ]; then
    required_input DB_HOST "Database host: " "Host is required"
    required_input DB_PORT "Database port [3306]: " "" "3306"
  fi

  required_input DB_NAME "Database name [panel]: " "" "panel"
  required_input DB_USER "Database username [pyrodactyl]: " "" "pyrodactyl"
  password_input DB_PASSWORD "Database password: " "Password cannot be empty"
}

# ------------------ Timezone Configuration ----------------- #

configure_timezone() {
  print_header
  print_flame "Timezone Configuration"

  output "This timezone setting is used by PHP for all date/time functions."
  output "Available timezones can be found at:"
  output "$(hyperlink "https://www.php.net/manual/en/timezones.php")"
  echo ""
  output "Format: Continent/City (e.g., Europe/Berlin, America/New_York, Asia/Tokyo)"
  output "Examples:"
  output "  Europe/Berlin       - Central European Time"
  output "  Europe/London       - Greenwich Mean Time / British Summer Time"
  output "  America/New_York    - Eastern Time (US)"
  output "  America/Los_Angeles - Pacific Time (US)"
  output "  Asia/Tokyo          - Japan Standard Time"
  output "  Australia/Sydney    - Australian Eastern Time"
  output "  UTC                 - Coordinated Universal Time (default)"
  echo ""

  required_input PANEL_TIMEZONE "Timezone [UTC]: " "" "UTC"
  output "Timezone set to: ${PANEL_TIMEZONE}"
}

# ------------------ Admin Account ----------------- #

configure_admin_account() {
  print_header
  print_flame "Admin Account Configuration"

  email_input PANEL_ADMIN_EMAIL "Admin email: " "Invalid email address"
  required_input PANEL_ADMIN_USERNAME "Admin username: " "Username is required"
  required_input PANEL_ADMIN_FIRSTNAME "First name: " "First name is required"
  required_input PANEL_ADMIN_LASTNAME "Last name: " "Last name is required"

  local password_match=false
  while [ "$password_match" == false ]; do
    password_input PANEL_ADMIN_PASSWORD "Admin password: " "Password cannot be empty"

    local password_confirm=""
    password_input password_confirm "Confirm password: " "Confirmation is required"

    if [ "$PANEL_ADMIN_PASSWORD" == "$password_confirm" ]; then
      password_match=true
    else
      error "Passwords do not match. Please try again."
    fi
  done
}

# ------------------ Auto-Updater ----------------- #

configure_auto_updater() {
  print_header
  print_flame "Auto-Updater Configuration"

  output "Auto-updaters allow automatic updates but may cause unexpected downtime."
  output "You can always install them later from the installer menu."
  echo ""

  local install_auto_update=""
  bool_input install_auto_update "Install auto-updater for the panel?" "n"

  if [ "$install_auto_update" == "y" ]; then
    INSTALL_AUTO_UPDATER=true
    output "Auto-updater will be installed"
  else
    output "Auto-updater will not be installed"
  fi
}

# ------------------ Firewall ----------------- #

configure_firewall() {
  print_header
  print_flame "Firewall Configuration"

  ask_firewall CONFIGURE_FIREWALL
}

# ------------------ Summary ----------------- #

show_summary() {
  print_header
  print_flame "Installation Summary"

  output "Please review the following configuration:"
  echo ""
  echo -e "  ${COLOR_ORANGE}Repository:${COLOR_NC}        ${PANEL_REPO} $([ "$PANEL_REPO_PRIVATE" == "true" ] && echo '(private)' || echo '(public)')"
  echo -e "  ${COLOR_ORANGE}Install Method:${COLOR_NC}    ${PANEL_INSTALL_METHOD}"
  echo -e "  ${COLOR_ORANGE}Domain:${COLOR_NC}            ${PANEL_FQDN}"
  echo -e "  ${COLOR_ORANGE}SSL:${COLOR_NC}               $([ "$CONFIGURE_LETSENCRYPT" == "true" ] && echo 'Let'\''s Encrypt' || ([ -n "$SSL_CERT_PATH" ] && echo 'Custom' || echo 'None'))"
  echo -e "  ${COLOR_ORANGE}Database:${COLOR_NC}          ${DB_NAME}@${DB_HOST}:${DB_PORT}"
  echo -e "  ${COLOR_ORANGE}Timezone:${COLOR_NC}          ${PANEL_TIMEZONE}"
  echo -e "  ${COLOR_ORANGE}Admin Email:${COLOR_NC}       ${PANEL_ADMIN_EMAIL}"
  echo -e "  ${COLOR_ORANGE}Auto-Updater:${COLOR_NC}      $([ "$INSTALL_AUTO_UPDATER" == "true" ] && echo 'Yes' || echo 'No')"
  echo -e "  ${COLOR_ORANGE}Firewall:${COLOR_NC}          $([ "$CONFIGURE_FIREWALL" == "true" ] && echo 'Yes' || echo 'No')"
  echo ""

  local confirm=""
  bool_input confirm "Proceed with installation?" "y"

  if [ "$confirm" != "y" ]; then
    error "Installation aborted"
    exit 1
  fi
}

# ------------------ Export and Run ----------------- #

export_variables() {
  export PANEL_REPO
  export PANEL_REPO_PRIVATE
  export GITHUB_TOKEN
  export PANEL_INSTALL_METHOD
  export PANEL_RELEASE_VERSION
  export PANEL_FQDN
  export PANEL_TIMEZONE
  export PANEL_ADMIN_EMAIL
  export PANEL_ADMIN_USERNAME
  export PANEL_ADMIN_FIRSTNAME
  export PANEL_ADMIN_LASTNAME
  export PANEL_ADMIN_PASSWORD
  export CONFIGURE_LETSENCRYPT
  export CONFIGURE_FIREWALL
  export INSTALL_AUTO_UPDATER
  export SSL_CERT_PATH
  export SSL_KEY_PATH
  export DB_HOST
  export DB_PORT
  export DB_NAME
  export DB_USER
  export DB_PASSWORD
}

# ------------------ Main ----------------- #

main() {
  print_flame "Welcome to the Pyrodactyl Panel Installer"

  configure_github_repository
  configure_installation_method
  # Note: configure_release_version is called within configure_installation_method when release method is selected
  configure_fqdn
  configure_ssl
  configure_database
  configure_timezone
  configure_admin_account
  configure_auto_updater
  configure_firewall
  show_summary

  export_variables

  output "Starting installation..."
  run_installer "panel"
}

main
