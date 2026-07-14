#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Pyrodactyl Auto-Updater Management UI                                              #
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

# ------------------ Root Check ----------------- #

check_root() {
  if [[ $EUID -ne 0 ]]; then
    error "This script must be executed with root privileges."
    exit 1
  fi
}

check_root

# ------------------ State Variables ----------------- #

PANEL_REPO=""
PANEL_REPO_PRIVATE=false
GITHUB_TOKEN_PANEL=""
ELYTRA_REPO=""
ELYTRA_REPO_PRIVATE=false
GITHUB_TOKEN_ELYTRA=""

# ------------------ Panel Auto-Updater ----------------- #

configure_panel_auto_updater() {
  print_header
  print_flame "Panel Auto-Updater Configuration"

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
    bool_input is_private "Is this a private repository?" "n" || true
    if [ "$is_private" == "y" ]; then
      PANEL_REPO_PRIVATE="true"
    else
      PANEL_REPO_PRIVATE="false"
    fi

    if [ "$PANEL_REPO_PRIVATE" == "true" ]; then
      echo ""
      output "A GitHub Personal Access Token is required for private repositories."
      output "Create one at: https://github.com/settings/tokens"
      output "Required scopes: ${COLOR_ORANGE}repo${COLOR_NC}"
      echo ""

      local token_valid=false
      while [ "$token_valid" == false ]; do
        password_input GITHUB_TOKEN_PANEL "Enter your GitHub token: " "Token cannot be empty"

        output "Validating token..."
        if validate_github_token "$GITHUB_TOKEN_PANEL" "$PANEL_REPO"; then
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

  # Auto-detect update method based on existing installation
  if [ -d "/var/www/pyrodactyl/.git" ]; then
    output "Detected git-based panel installation - will use git for updates"
    output "Verifying git repository access..."
    
    # Verify access using http.extraHeader instead of token in URL
    local git_ls_cmd=("git" "ls-remote" "--exit-code" "https://github.com/${PANEL_REPO}.git" "HEAD")
    if [ "$PANEL_REPO_PRIVATE" == "true" ] && [ -n "$GITHUB_TOKEN_PANEL" ]; then
      git_ls_cmd=("git" "-c" "http.extraHeader=Authorization: Bearer ${GITHUB_TOKEN_PANEL}" "ls-remote" "--exit-code" "https://github.com/${PANEL_REPO}.git" "HEAD")
    fi
    
    if ! "${git_ls_cmd[@]}" &>/dev/null; then
      error "Cannot access git repository. Please verify the repository exists and your token is valid (if private)."
      exit 1
    fi
    success "Git repository access verified"
  else
    output "Detected release-based panel installation - will check GitHub releases"
    output "Checking for releases in repository..."
    if ! check_releases_exist "$PANEL_REPO" "$GITHUB_TOKEN_PANEL"; then
      echo ""
      error "No releases found in repository: ${PANEL_REPO}"
      warning "You must publish a release before using the auto-updater."
      exit 1
    fi

    local latest_release
    latest_release=$(get_latest_release "$PANEL_REPO" "$GITHUB_TOKEN_PANEL")
    success "Found release: ${latest_release}"
  fi

  export PANEL_REPO
  export PANEL_REPO_PRIVATE
  export GITHUB_TOKEN="$GITHUB_TOKEN_PANEL"

  install_auto_updater_panel
}

# ------------------ Elytra Auto-Updater ----------------- #

configure_elytra_auto_updater() {
  print_header
  print_flame "Elytra Auto-Updater Configuration"

  output "The default Elytra repository is:"
  output "  ${COLOR_ORANGE}${DEFAULT_ELYTRA_REPO}${COLOR_NC}"
  echo ""

  local use_default=""
  bool_input use_default "Use default repository?" "y"

  if [ "$use_default" == "y" ]; then
    ELYTRA_REPO="$DEFAULT_ELYTRA_REPO"
  else
    required_input ELYTRA_REPO "Enter the GitHub repository (format: owner/repo): " "Repository cannot be empty"

    if [[ ! "$ELYTRA_REPO" =~ ^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]; then
      error "Invalid repository format. Must be 'owner/repo'"
      exit 1
    fi
  fi

  echo ""
  output "Repository: ${COLOR_ORANGE}${ELYTRA_REPO}${COLOR_NC}"

  # Only ask about private repo if not using default (default is public)
  if [ "$use_default" == "n" ]; then
    local is_private=""
    bool_input is_private "Is this a private repository?" "n" || true
    if [ "$is_private" == "y" ]; then
      ELYTRA_REPO_PRIVATE="true"
    else
      ELYTRA_REPO_PRIVATE="false"
    fi

    if [ "$ELYTRA_REPO_PRIVATE" == "true" ]; then
      echo ""
      output "A GitHub Personal Access Token is required for private repositories."
      output "Create one at: https://github.com/settings/tokens"
      output "Required scopes: ${COLOR_ORANGE}repo${COLOR_NC}"
      echo ""

      local token_valid=false
      while [ "$token_valid" == false ]; do
        password_input GITHUB_TOKEN_ELYTRA "Enter your GitHub token: " "Token cannot be empty"

        output "Validating token..."
        if validate_github_token "$GITHUB_TOKEN_ELYTRA" "$ELYTRA_REPO"; then
          success "Token validated successfully"
          token_valid=true
        else
          warning "Token validation failed. Please check your token and try again."
        fi
      done
    fi
  else
    ELYTRA_REPO_PRIVATE="false"
  fi

  # Elytra always uses release-based updates
  output "Checking for releases in repository..."
  if ! check_releases_exist "$ELYTRA_REPO" "$GITHUB_TOKEN_ELYTRA"; then
    echo ""
    error "No releases found in repository: ${ELYTRA_REPO}"
    warning "You must publish a release before using the auto-updater."
    exit 1
  fi

  local latest_release
  latest_release=$(get_latest_release "$ELYTRA_REPO" "$GITHUB_TOKEN_ELYTRA")
  success "Found release: ${latest_release}"

  export ELYTRA_REPO
  export ELYTRA_REPO_PRIVATE
  export GITHUB_TOKEN="$GITHUB_TOKEN_ELYTRA"

  install_auto_updater_elytra
}

# ------------------ Both Auto-Updaters ----------------- #

configure_both_auto_updaters() {
  print_header
  print_flame "Configure Both Auto-Updaters"

  configure_panel_auto_updater

  echo ""
  output "Now configuring Elytra auto-updater..."
  echo ""

  configure_elytra_auto_updater

  success "Both auto-updaters installed successfully!"
}

# ------------------ Remove Menu ----------------- #

show_remove_menu() {
  print_header
  print_flame "Remove Auto-Updaters"

  # Check what's installed
  local panel_updater_installed=false
  local elytra_updater_installed=false

  if systemctl is-enabled --quiet pyrodactyl-panel-auto-update.timer 2>/dev/null; then
    panel_updater_installed=true
  fi

  if systemctl is-enabled --quiet pyrodactyl-elytra-auto-update.timer 2>/dev/null; then
    elytra_updater_installed=true
  fi

  if [ "$panel_updater_installed" == false ] && [ "$elytra_updater_installed" == false ]; then
    warning "No auto-updaters are currently installed."
    echo ""
    output "Press Enter to return to main menu..."
    read -r
    return
  fi

  output "Which auto-updaters would you like to remove?"
  echo ""

  if [ "$panel_updater_installed" == true ]; then
    output "[${COLOR_ORANGE}0${COLOR_NC}] Panel auto-updater only"
  fi

  if [ "$elytra_updater_installed" == true ]; then
    output "[${COLOR_ORANGE}1${COLOR_NC}] Elytra auto-updater only"
  fi

  if [ "$panel_updater_installed" == true ] && [ "$elytra_updater_installed" == true ]; then
    output "[${COLOR_ORANGE}2${COLOR_NC}] Both auto-updaters"
  fi

  output "[${COLOR_ORANGE}3${COLOR_NC}] Cancel"
  echo ""

  local choice=""
  while true; do
    echo -n "* Select option: "
    read -r choice

    case "$choice" in
      0)
        if [ "$panel_updater_installed" == true ]; then
          warning "This will remove the Panel auto-updater"
          local confirm=""
          bool_input confirm "Are you sure?" "n"
          if [ "$confirm" == "y" ]; then
            remove_auto_updater_panel
            success "Panel auto-updater removed"
          fi
          break
        else
          error "Invalid option"
        fi
        ;;
      1)
        if [ "$elytra_updater_installed" == true ]; then
          warning "This will remove the Elytra auto-updater"
          local confirm=""
          bool_input confirm "Are you sure?" "n"
          if [ "$confirm" == "y" ]; then
            remove_auto_updater_elytra
            success "Elytra auto-updater removed"
          fi
          break
        else
          error "Invalid option"
        fi
        ;;
      2)
        if [ "$panel_updater_installed" == true ] && [ "$elytra_updater_installed" == true ]; then
          warning "This will remove both auto-updaters"
          local confirm=""
          bool_input confirm "Are you sure?" "n"
          if [ "$confirm" == "y" ]; then
            remove_auto_updater_panel
            remove_auto_updater_elytra
            success "All auto-updaters removed"
          fi
          break
        else
          error "Invalid option"
        fi
        ;;
      3)
        output "Cancelled"
        break
        ;;
      *)
        error "Invalid option"
        ;;
    esac
  done
}

# ------------------ Trigger Update Functions ----------------- #

trigger_panel_update() {
  print_header
  print_flame "Trigger Panel Update"

  if ! systemctl is-enabled --quiet pyrodactyl-panel-auto-update.timer 2>/dev/null; then
    error "Panel auto-updater is not installed."
    echo ""
    output "Please install the auto-updater first."
    return
  fi

  output "This will manually trigger the panel update check."
  output "Update method: $([ -d "/var/www/pyrodactyl/.git" ] && echo "git-based" || echo "release-based")"
  echo ""

  # Get current and latest versions for display
  local current_version="unknown"
  local latest_version="unknown"
  
  if [ -f "/var/www/pyrodactyl/config/app.php" ]; then
    current_version=$(grep "'version'" "/var/www/pyrodactyl/config/app.php" 2>/dev/null | head -1 | sed -E "s/.*'version' => '([^']+)'.*/\1/" || echo "unknown")
  fi
  
  # Get latest version from GitHub
  local panel_repo="${PANEL_REPO:-pyrodactyl-oss/pyrodactyl}"
  local github_token="${GITHUB_TOKEN_PANEL:-$GITHUB_TOKEN}"
  local curl_opts=(-sL --max-time 10)
  if [ -n "$github_token" ]; then
    curl_opts+=(-H "Authorization: Bearer $github_token")
  fi
  latest_version=$(curl "${curl_opts[@]}" "https://api.github.com/repos/$panel_repo/releases/latest" 2>/dev/null | sed -nE 's/.*"tag_name":[[:space:]]*"([^"]+)".*/\1/p' | head -1)
  [ -z "$latest_version" ] && latest_version="unknown"
  
  output "Current version: ${COLOR_ORANGE}${current_version}${COLOR_NC}"
  if [ "$latest_version" != "unknown" ] && [ "$latest_version" != "null" ]; then
    output "Latest version:  ${COLOR_ORANGE}${latest_version}${COLOR_NC}"
    if [ "$current_version" == "$latest_version" ]; then
      output "${COLOR_GREEN}You are already on the latest version!${COLOR_NC}"
    fi
  else
    output "Latest version:  ${COLOR_YELLOW}Could not fetch${COLOR_NC}"
  fi
  echo ""

  local confirm=""
  bool_input confirm "Run update check now?" "y"

  if [ "$confirm" == "y" ]; then
    echo ""
    output "Running panel auto-updater..."
    echo ""

    if /usr/local/bin/pyrodactyl-auto-update-panel.sh --verbose; then
      success "Panel update check completed successfully"
    else
      warning "Panel update check finished with issues (see output above)"
    fi

    echo ""
    output "Press Enter to continue..."
    read -r
  fi
}

trigger_elytra_update() {
  print_header
  print_flame "Trigger Elytra Update"

  if ! systemctl is-enabled --quiet pyrodactyl-elytra-auto-update.timer 2>/dev/null; then
    error "Elytra auto-updater is not installed."
    echo ""
    output "Please install the auto-updater first."
    return
  fi

  output "This will manually trigger the Elytra update check."
  echo ""

  # Get current and latest versions for display
  local current_version="unknown"
  local latest_version="unknown"
  
  if [ -f "/etc/pyrodactyl/elytra-version" ]; then
    current_version=$(cat "/etc/pyrodactyl/elytra-version" 2>/dev/null || echo "unknown")
  elif [ -x "/usr/local/bin/elytra" ]; then
    current_version=$(/usr/local/bin/elytra --version 2>/dev/null || echo "unknown")
  fi
  
  # Get latest version from GitHub
  local elytra_repo="${ELYTRA_REPO:-pyrohost/elytra}"
  local github_token="${GITHUB_TOKEN_ELYTRA:-$GITHUB_TOKEN}"
  local curl_args=(-sL --max-time 10)
  if [ -n "$github_token" ]; then
    curl_args+=(-H "Authorization: Bearer $github_token")
  fi
  latest_version=$(curl "${curl_args[@]}" "https://api.github.com/repos/$elytra_repo/releases/latest" 2>/dev/null | sed -nE 's/.*"tag_name":[[:space:]]*"([^"]+)".*/\1/p' | head -1)
  [ -z "$latest_version" ] && latest_version="unknown"
  
  output "Current version: ${COLOR_ORANGE}${current_version}${COLOR_NC}"
  if [ "$latest_version" != "unknown" ] && [ "$latest_version" != "null" ]; then
    output "Latest version:  ${COLOR_ORANGE}${latest_version}${COLOR_NC}"
    if [ "$current_version" == "$latest_version" ]; then
      output "${COLOR_GREEN}You are already on the latest version!${COLOR_NC}"
    fi
  else
    output "Latest version:  ${COLOR_YELLOW}Could not fetch${COLOR_NC}"
  fi
  echo ""

  local confirm=""
  bool_input confirm "Run update check now?" "y"

  if [ "$confirm" == "y" ]; then
    echo ""
    output "Running Elytra auto-updater..."
    echo ""

    if /usr/local/bin/pyrodactyl-auto-update-elytra.sh --verbose; then
      success "Elytra update check completed successfully"
    else
      warning "Elytra update check finished with issues (see output above)"
    fi

    echo ""
    output "Press Enter to continue..."
    read -r
  fi
}

# ------------------ Main Menu ----------------- #

show_main_menu() {
  # Check what's installed for menu display
  local panel_updater_installed=false
  local elytra_updater_installed=false

  if systemctl is-enabled --quiet pyrodactyl-panel-auto-update.timer 2>/dev/null; then
    panel_updater_installed=true
  fi

  if systemctl is-enabled --quiet pyrodactyl-elytra-auto-update.timer 2>/dev/null; then
    elytra_updater_installed=true
  fi

  while true; do
    print_header
    print_flame "Auto-Updater Management"

    output "What would you like to do?"
    echo ""
    output "[${COLOR_ORANGE}0${COLOR_NC}] Install Panel auto-updater"
    output "[${COLOR_ORANGE}1${COLOR_NC}] Install Elytra auto-updater"
    output "[${COLOR_ORANGE}2${COLOR_NC}] Install both auto-updaters"
    echo ""

    if [ "$panel_updater_installed" == true ]; then
      output "[${COLOR_ORANGE}3${COLOR_NC}] Trigger Panel update check now"
    else
      output "[${COLOR_GRAY}3${COLOR_NC}] Trigger Panel update check now (not installed)"
    fi

    if [ "$elytra_updater_installed" == true ]; then
      output "[${COLOR_ORANGE}4${COLOR_NC}] Trigger Elytra update check now"
    else
      output "[${COLOR_GRAY}4${COLOR_NC}] Trigger Elytra update check now (not installed)"
    fi

    echo ""
    output "[${COLOR_ORANGE}5${COLOR_NC}] Remove auto-updaters"
    echo ""
    output "[${COLOR_ORANGE}6${COLOR_NC}] Return to main menu"
    echo ""

    local choice=""
    echo -n "* Select [0-6]: "
    read -r choice

    case "$choice" in
      0)
        configure_panel_auto_updater
        panel_updater_installed=true
        echo ""
        output "Press Enter to continue..."
        read -r
        ;;
      1)
        configure_elytra_auto_updater
        elytra_updater_installed=true
        echo ""
        output "Press Enter to continue..."
        read -r
        ;;
      2)
        configure_both_auto_updaters
        panel_updater_installed=true
        elytra_updater_installed=true
        echo ""
        output "Press Enter to continue..."
        read -r
        ;;
      3)
        trigger_panel_update
        ;;
      4)
        trigger_elytra_update
        ;;
      5)
        show_remove_menu
        # Refresh status after potential removal
        if ! systemctl is-enabled --quiet pyrodactyl-panel-auto-update.timer 2>/dev/null; then
          panel_updater_installed=false
        fi
        if ! systemctl is-enabled --quiet pyrodactyl-elytra-auto-update.timer 2>/dev/null; then
          elytra_updater_installed=false
        fi
        ;;
      6)
        output "Returning to main menu..."
        exit 0
        ;;
      *)
        error "Invalid option. Please select 0-6."
        sleep 2
        ;;
    esac
  done
}

# ------------------ Main ----------------- #

main() {
  show_main_menu
}

main
