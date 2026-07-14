#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Pyrodactyl Uninstallation UI                                                       #
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
    echo "* ERROR: This script must be executed with root privileges."
    exit 1
  fi
}

check_root

# ------------------ Configuration Variables ----------------- #

REMOVE_PANEL=false
REMOVE_ELYTRA=false
REMOVE_AUTO_UPDATERS=false
REMOVE_DATABASE=false
REMOVE_DATA=false

# ------------------ Detection ----------------- #

detect_installed_components() {
  PANEL_INSTALLED=false
  ELYTRA_INSTALLED=false
  PANEL_UPDATER_INSTALLED=false
  ELYTRA_UPDATER_INSTALLED=false

  if [ -d "/var/www/pyrodactyl" ]; then
    PANEL_INSTALLED=true
  fi

  if [ -f "/usr/local/bin/elytra" ]; then
    ELYTRA_INSTALLED=true
  fi

  if systemctl is-enabled --quiet pyrodactyl-panel-auto-update.timer 2>/dev/null; then
    PANEL_UPDATER_INSTALLED=true
  fi

  if systemctl is-enabled --quiet pyrodactyl-elytra-auto-update.timer 2>/dev/null; then
    ELYTRA_UPDATER_INSTALLED=true
  fi
}

# ------------------ Main Menu ----------------- #

show_main_menu() {
  print_header
  print_flame "Uninstall Pyrodactyl / Elytra"

  output "Installed components detected:"
  echo ""

  if [ "$PANEL_INSTALLED" == true ]; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Pyrodactyl Panel"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Pyrodactyl Panel"
  fi

  if [ "$ELYTRA_INSTALLED" == true ]; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Elytra Daemon"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Elytra Daemon"
  fi

  if [ "$PANEL_UPDATER_INSTALLED" == true ] || [ "$ELYTRA_UPDATER_INSTALLED" == true ]; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Auto-updaters"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Auto-updaters"
  fi

  echo ""
  output "What would you like to uninstall?"
  echo ""
  output "[${COLOR_ORANGE}0${COLOR_NC}] Uninstall Panel only"
  output "[${COLOR_ORANGE}1${COLOR_NC}] Uninstall Elytra only"
  output "[${COLOR_ORANGE}2${COLOR_NC}] Uninstall both Panel and Elytra"
  output "[${COLOR_ORANGE}3${COLOR_NC}] Remove auto-updaters only"
  output "[${COLOR_ORANGE}4${COLOR_NC}] Uninstall everything (Panel, Elytra, Auto-updaters)"
  output "[${COLOR_ORANGE}5${COLOR_NC}] Cancel"
  echo ""

  local choice=""
  while true; do
    echo -n "* Select [0-5]: "
    read -r choice

    case "$choice" in
      0)
        if [ "$PANEL_INSTALLED" == false ]; then
          error "Panel is not installed"
          continue
        fi
        REMOVE_PANEL=true
        confirm_uninstall "Panel"
        return
        ;;
      1)
        if [ "$ELYTRA_INSTALLED" == false ]; then
          error "Elytra is not installed"
          continue
        fi
        REMOVE_ELYTRA=true
        confirm_uninstall "Elytra"
        return
        ;;
      2)
        if [ "$PANEL_INSTALLED" == false ] && [ "$ELYTRA_INSTALLED" == false ]; then
          error "Neither Panel nor Elytra are installed"
          continue
        fi
        REMOVE_PANEL=true
        REMOVE_ELYTRA=true
        confirm_uninstall "both Panel and Elytra"
        return
        ;;
      3)
        if [ "$PANEL_UPDATER_INSTALLED" == false ] && [ "$ELYTRA_UPDATER_INSTALLED" == false ]; then
          error "No auto-updaters are installed"
          continue
        fi
        REMOVE_AUTO_UPDATERS=true
        confirm_uninstall "auto-updaters"
        return
        ;;
      4)
        if [ "$PANEL_INSTALLED" == false ] && [ "$ELYTRA_INSTALLED" == false ]; then
          error "Nothing is installed"
          continue
        fi
        REMOVE_PANEL=true
        REMOVE_ELYTRA=true
        REMOVE_AUTO_UPDATERS=true
        confirm_uninstall "everything"
        return
        ;;
      5)
        output "Cancelled"
        exit 0
        ;;
      *)
        error "Invalid option. Please select 0-5."
        ;;
    esac
  done
}

# ------------------ Confirmation ----------------- #

confirm_uninstall() {
  local component="$1"

  print_header
  print_flame "Confirm Uninstall"

  warning "You are about to uninstall ${component}"
  echo ""

  if [ "$REMOVE_PANEL" == true ]; then
    output "Panel removal includes:"
    output "  - Panel files (/var/www/pyrodactyl)"
    output "  - Nginx configuration"
    output "  - Systemd services (pyroq)"
    output "  - Cron jobs"
    echo ""

    local remove_db=""
    bool_input remove_db "Also remove the panel database?" "n"
    [ "$remove_db" == "y" ] && REMOVE_DATABASE=true

    local remove_data=""
    bool_input remove_data "Also remove all server data and backups?" "n"
    [ "$remove_data" == "y" ] && REMOVE_DATA=true
  fi

  if [ "$REMOVE_ELYTRA" == true ]; then
    echo ""
    output "Elytra removal includes:"
    output "  - Elytra binary (/usr/local/bin/elytra)"
    output "  - Elytra configuration (/etc/elytra)"
    output "  - Systemd service (elytra)"
    output "  - Docker containers (game servers will be stopped)"
    echo ""
  fi

  if [ "$REMOVE_AUTO_UPDATERS" == true ]; then
    echo ""
    output "Auto-updater removal includes:"
    output "  - Auto-update scripts"
    output "  - Systemd timer services"
    output "  - Configuration files"
    echo ""
  fi

  echo ""
  warning "This action cannot be undone!"
  echo ""
  local confirm=""
  bool_input confirm "Are you sure you want to proceed?" "n"

  if [ "$confirm" != "y" ]; then
    output "Uninstall cancelled"
    exit 0
  fi
}

# ------------------ Export and Run ----------------- #

export_variables() {
  export REMOVE_PANEL
  export REMOVE_ELYTRA
  export REMOVE_AUTO_UPDATERS
  export REMOVE_DATABASE
  export REMOVE_DATA
}

# ------------------ Main ----------------- #

main() {
  detect_installed_components

  if [ "$PANEL_INSTALLED" == false ] && [ "$ELYTRA_INSTALLED" == false ] && [ "$PANEL_UPDATER_INSTALLED" == false ] && [ "$ELYTRA_UPDATER_INSTALLED" == false ]; then
    print_header
    print_flame "Nothing to Uninstall"
    output "No Pyrodactyl components were detected on this system."
    echo ""
    output "If you believe this is an error, you may need to manually remove:"
    output "  - /var/www/pyrodactyl (Panel files)"
    output "  - /usr/local/bin/elytra (Elytra binary)"
    output "  - /etc/elytra (Elytra configuration)"
    exit 0
  fi

  show_main_menu
  export_variables

  output "Starting uninstallation..."
  run_installer "uninstall"
}

main
