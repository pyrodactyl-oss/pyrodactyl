#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Pyrodactyl Installer Library                                                       #
#                                                                                    #
# Copyright (C) 2025, Muspelheim Hosting                                             #
#                                                                                    #
# https://github.com/Muspelheim-Hosting/pyrodactyl-installer                         #
#                                                                                    #
######################################################################################

# ------------------ Version Configuration ----------------- #

export GITHUB_SOURCE="${GITHUB_SOURCE:-main}"
export SCRIPT_RELEASE="${SCRIPT_RELEASE:-v1.0.0}"
export GITHUB_BASE_URL="${GITHUB_BASE_URL:-https://raw.githubusercontent.com/itzzmateo/hydrodactyl/install}"
export GITHUB_URL="$GITHUB_BASE_URL/$GITHUB_SOURCE"



# ------------------ Default Repositories ----------------- #

export DEFAULT_PANEL_REPO="itzzmateo/hydrodactyl"
export DEFAULT_ELYTRA_REPO="pyrohost/elytra"

# ------------------ Path Configuration ----------------- #

export INSTALL_DIR="/var/www/pyrodactyl"
export ELYTRA_DIR="/etc/elytra"
export PANEL_CONFIG_DIR="/etc/pyrodactyl"
export LOG_PATH="/var/log/pyrodactyl-installer.log"

# ------------------ System Requirements ----------------- #

# Minimum Requirements
export MIN_CPU_CORES=2
export MIN_RAM_MB=2048      # 2GB
export MIN_DISK_GB=20

# Recommended Requirements
export REC_CPU_CORES=4
export REC_RAM_MB=4096      # 4GB
export REC_DISK_GB=50

# ------------------ Web Server User ----------------- #

export WEBUSER="www-data"
export WEBGROUP="www-data"
export PHP_VERSION="8.5"

# ------------------ Colors - Orange Gradient ----------------- #

export COLOR_DARK_ORANGE='\033[38;5;208m'
export COLOR_ORANGE='\033[38;5;214m'
export COLOR_LIGHT_ORANGE='\033[38;5;220m'
export COLOR_YELLOW='\033[1;33m'
export COLOR_GREEN='\033[0;32m'
export COLOR_RED='\033[0;31m'
export COLOR_BLUE='\033[0;34m'
export COLOR_CYAN='\033[0;36m'
export COLOR_GRAY='\033[38;5;240m'
export COLOR_NC='\033[0m'

# ------------------ Gradient Colors for Header ----------------- #
# Smooth flame gradient from red (top) to yellow (bottom)
# Smooth flame gradient colors (top to bottom) - red to gold
export GRADIENT_1='\033[38;5;196m'   # Deep red
export GRADIENT_2='\033[38;5;202m'   # Red-orange
export GRADIENT_3='\033[38;5;208m'   # Dark orange
export GRADIENT_4='\033[38;5;214m'   # Orange
export GRADIENT_5='\033[38;5;220m'   # Light orange
export GRADIENT_6='\033[38;5;221m'   # Yellow-orange
export GRADIENT_7='\033[38;5;222m'   # Gold
export GRADIENT_8='\033[38;5;226m'   # Yellow-gold
export GRADIENT_9='\033[38;5;227m'   # Bright gold
export GRADIENT_10='\033[38;5;228m'  # Light gold
export GRADIENT_11='\033[38;5;229m'  # Pale gold

# Gradient array for flame effects
GRADIENT_COLORS=(
  '\033[38;5;196m'  # Dark red
  '\033[38;5;202m'  # Red-Orange
  '\033[38;5;208m'  # Orange
  '\033[38;5;214m'  # Light Orange
  '\033[38;5;220m'  # Yellow-Orange
  '\033[38;5;226m'  # Yellow
)

# ------------------ Library Loaded Marker ----------------- #

lib_loaded() {
  return 0
}



# ------------------ Visual Functions ----------------- #

output() {
  echo -e "* $1"
}

success() {
  echo ""
  echo -e "* ${COLOR_GREEN}SUCCESS${COLOR_NC}: $1"
  echo ""
}

error() {
  echo ""
  echo -e "* ${COLOR_RED}ERROR${COLOR_NC}: $1" 1>&2
  echo ""
}

warning() {
  echo ""
  echo -e "* ${COLOR_YELLOW}WARNING${COLOR_NC}: $1"
  echo ""
}

info() {
  echo -e "* ${COLOR_BLUE}INFO${COLOR_NC}: $1"
}

print_brake() {
  local char="${2:-─}"
  for ((n = 0; n < $1; n++)); do
    echo -n "$char"
  done
  echo ""
}

print_header() {
  clear 2>/dev/null || true
  echo ""

  # Flame gradient header - smooth color transition from top to bottom
  echo -e "${GRADIENT_1}    ╔══════════════════════════════════════════════════════════════════════════════════════╗"
  echo -e "${GRADIENT_2}    ║                                                                                      ║"
  echo -e "${GRADIENT_3}    ║  ███╗   ███╗██╗   ██╗███████╗██████╗ ███████╗██╗     ██╗  ██╗███████╗██╗███╗   ███╗  ║"
  echo -e "${GRADIENT_4}    ║  ████╗ ████║██║   ██║██╔════╝██╔══██╗██╔════╝██║     ██║  ██║██╔════╝██║████╗ ████║  ║"
  echo -e "${GRADIENT_5}    ║  ██╔████╔██║██║   ██║███████╗██████╔╝█████╗  ██║     ███████║█████╗  ██║██╔████╔██║  ║"
  echo -e "${GRADIENT_6}    ║  ██║╚██╔╝██║██║   ██║╚════██║██╔═══╝ ██╔══╝  ██║     ██╔══██║██╔══╝  ██║██║╚██╔╝██║  ║"
  echo -e "${GRADIENT_7}    ║  ██║ ╚═╝ ██║╚██████╔╝███████║██║     ███████╗███████╗██║  ██║███████╗██║██║ ╚═╝ ██║  ║"
  echo -e "${GRADIENT_8}    ║  ╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝     ╚═╝  ║"
  echo -e "${GRADIENT_9}    ║                                                                                      ║"
  echo -e "${GRADIENT_10}    ║                            Pyrodactyl Installation Manager                           ║"
  echo -e "${GRADIENT_11}    ╚══════════════════════════════════════════════════════════════════════════════════════╝"
  echo -e "${COLOR_NC}"
  echo -e "    ${COLOR_ORANGE}Version:${COLOR_NC} ${SCRIPT_RELEASE}  ${COLOR_ORANGE}|${COLOR_NC}  ${COLOR_ORANGE}By:${COLOR_NC} Muspelheim Hosting"
  echo ""
}

print_flame() {
  local message="$1"

  echo ""
  echo -e "${COLOR_ORANGE}  $message${COLOR_NC}"
  echo ""
}

hyperlink() {
  echo -e "\033]8;;${1}\033\\${1}\033]8;;\033\\"
}

welcome() {
  print_header

  detect_os

  echo -e "  ${COLOR_ORANGE}Operating System:${COLOR_NC} $OS $OS_VER_MAJOR ($ARCH)"

  # Display system resources
  local cpu_cores=$(nproc 2>/dev/null || echo "1")
  local ram_human=$(free -h 2>/dev/null | awk '/^Mem:/{print $2}' || echo "Unknown")
  local disk_human=$(df -h / 2>/dev/null | awk 'NR==2 {print $4}' || echo "Unknown")
  local swap_mb=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}' || echo "0")
  local swap_human=$(free -h 2>/dev/null | awk '/^Swap:/{print $2}' || echo "0")

  echo -e "  ${COLOR_ORANGE}System Resources:${COLOR_NC} ${cpu_cores} cores, ${ram_human} RAM, ${disk_human} disk, ${swap_human} swap"

  # Warn if no swap configured
  if [ "$swap_mb" -eq 0 ]; then
    echo ""
    echo -e "  ${COLOR_YELLOW}⚠ Warning: No swap configured. Consider setting up swap for system stability.${COLOR_NC}"
    echo -e "     Use the Repair Tool (option 7) to configure swap."
  fi

  echo ""

  # Check installed components
  if [ -d "/var/www/pyrodactyl" ]; then
    local panel_version="unknown"
    if [ -f "/var/www/pyrodactyl/config/app.php" ]; then
      panel_version=$(grep "'version'" /var/www/pyrodactyl/config/app.php 2>/dev/null | head -1 | cut -d"'" -f4 || echo "unknown")
    fi
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Panel installed${panel_version:+ (v$panel_version)}"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Panel not installed"
  fi

  if [ -f "/usr/local/bin/elytra" ]; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Elytra installed"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Elytra not installed"
  fi

  if systemctl is-enabled --quiet pyrodactyl-panel-auto-update.timer 2>/dev/null; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Panel auto-updater enabled"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Panel auto-updater not installed"
  fi

  if systemctl is-enabled --quiet pyrodactyl-elytra-auto-update.timer 2>/dev/null; then
    echo -e "  ${COLOR_GREEN}✓${COLOR_NC} Elytra auto-updater enabled"
  else
    echo -e "  ${COLOR_RED}✗${COLOR_NC} Elytra auto-updater not installed"
  fi

  echo ""
  print_brake 70
  echo ""
}

# ------------------ OS Detection ----------------- #

detect_os() {
  export OS=""
  export OS_VER_MAJOR=""
  export CPU_ARCHITECTURE=""
  export ARCH=""
  export SUPPORTED=false

  CPU_ARCHITECTURE=$(uname -m)

  case "$CPU_ARCHITECTURE" in
    x86_64)
      ARCH=amd64
      ;;
    arm64|aarch64)
      ARCH=arm64
      ;;
    *)
      error "Only x86_64 and arm64 are supported!"
      exit 1
      ;;
  esac

  if [ -f /etc/os-release ]; then
    # shellcheck source=/dev/null
    source /etc/os-release
    OS=$(echo "$ID" | awk '{print tolower($0)}')
    OS_VER=$VERSION_ID
  elif type lsb_release >/dev/null 2>&1; then
    OS=$(lsb_release -si | awk '{print tolower($0)}')
    OS_VER=$(lsb_release -sr)
  elif [ -f /etc/lsb-release ]; then
    # shellcheck source=/dev/null
    source /etc/lsb-release
    OS=$(echo "$DISTRIB_ID" | awk '{print tolower($0)}')
    OS_VER=$DISTRIB_RELEASE
  elif [ -f /etc/debian_version ]; then
    OS="debian"
    OS_VER=$(cat /etc/debian_version)
  else
    OS=$(uname -s)
    OS_VER=$(uname -r)
  fi

  OS=$(echo "$OS" | awk '{print tolower($0)}')
  OS_VER_MAJOR=$(echo "$OS_VER" | cut -d. -f1)

  # Set web user based on OS
  case "$OS" in
    ubuntu|debian)
      WEBUSER="www-data"
      WEBGROUP="www-data"
      ;;
    rocky|almalinux|centos|rhel|fedora)
      WEBUSER="nginx"
      WEBGROUP="nginx"
      ;;
  esac

  # Check supported versions
  case "$OS" in
    ubuntu)
      [ "$OS_VER_MAJOR" == "22" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "24" ] && SUPPORTED=true
      export DEBIAN_FRONTEND=noninteractive
      ;;
    debian)
      [ "$OS_VER_MAJOR" == "11" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "12" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "13" ] && SUPPORTED=true
      export DEBIAN_FRONTEND=noninteractive
      ;;
    rocky|almalinux)
      [ "$OS_VER_MAJOR" == "8" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "9" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "10" ] && SUPPORTED=true
      ;;
    fedora)
      [ "$OS_VER_MAJOR" == "40" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "41" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "42" ] && SUPPORTED=true
      ;;
    rhel)
      [ "$OS_VER_MAJOR" == "9" ] && SUPPORTED=true
      [ "$OS_VER_MAJOR" == "10" ] && SUPPORTED=true
      ;;
    arch)
      SUPPORTED=true
      ;;
  esac

  if [ "$SUPPORTED" != true ]; then
    error "Operating system $OS $OS_VER is not officially supported."
    warning "The installer may still work, but proceed at your own risk."
    echo ""
    local continue_anyway=""
    while [[ "$continue_anyway" != "y" && "$continue_anyway" != "n" ]]; do
      echo -n "* Continue anyway? [y/N]: "
      read -r continue_anyway
      continue_anyway=$(echo "$continue_anyway" | tr '[:upper:]' '[:lower:]')
      [ -z "$continue_anyway" ] && continue_anyway="n"

      if [[ "$continue_anyway" != "y" && "$continue_anyway" != "n" ]]; then
        error "Invalid input. Please enter 'y' or 'n'."
      fi
    done

    if [[ "$continue_anyway" == "n" ]]; then
      exit 1
    fi
  fi
}

# ------------------ Validation Functions ----------------- #

# ------------------ System Resource Functions ----------------- #

get_cpu_cores() {
  nproc 2>/dev/null || echo "1"
}

get_ram_mb() {
  free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0"
}

get_ram_human() {
  free -h 2>/dev/null | awk '/^Mem:/{print $2}' || echo "Unknown"
}

get_disk_gb() {
  df -BG / 2>/dev/null | awk 'NR==2 {gsub(/G/,""); print $4}' || echo "0"
}

get_disk_human() {
  df -h / 2>/dev/null | awk 'NR==2 {print $4}' || echo "Unknown"
}

get_swap_mb() {
  local swap_mb=$(free -m 2>/dev/null | awk '/^Swap:/{print $2}')
  echo "${swap_mb:-0}"
}

get_swap_human() {
  free -h 2>/dev/null | awk '/^Swap:/{print $2}' || echo "0"
}

check_system_resources() {
  local cpu_cores=$(get_cpu_cores)
  local ram_mb=$(get_ram_mb)
  local disk_gb=$(get_disk_gb)
  local below_minimum=false
  local warnings=()

  # Check minimum requirements
  if [ "$cpu_cores" -lt "$MIN_CPU_CORES" ]; then
    warnings+=("CPU cores: $cpu_cores (minimum: $MIN_CPU_CORES)")
    below_minimum=true
  fi

  if [ "$ram_mb" -lt "$MIN_RAM_MB" ]; then
    warnings+=("RAM: ${ram_mb}MB / $(get_ram_human) (minimum: ${MIN_RAM_MB}MB / 2GB)")
    below_minimum=true
  fi

  if [ "$disk_gb" -lt "$MIN_DISK_GB" ]; then
    warnings+=("Disk space: ${disk_gb}GB (minimum: ${MIN_DISK_GB}GB)")
    below_minimum=true
  fi

  # Output results
  echo ""
  output "${COLOR_ORANGE}System Resources${COLOR_NC}"
  print_brake 40
  output "CPU Cores:        $cpu_cores"
  output "RAM:              $(get_ram_human) (${ram_mb}MB)"
  output "Disk (root):      $(get_disk_human) (${disk_gb}GB)"
  output "Swap:             $(get_swap_human)"
  print_brake 40

  # Show recommendations
  if [ "$below_minimum" == true ]; then
    echo ""
    warning "System is below minimum requirements:"
    for warn in "${warnings[@]}"; do
      output "  - $warn"
    done
    return 1
  elif [ "$cpu_cores" -lt "$REC_CPU_CORES" ] || [ "$ram_mb" -lt "$REC_RAM_MB" ]; then
    echo ""
    info "System meets minimum requirements but is below recommended:"
    [ "$cpu_cores" -lt "$REC_CPU_CORES" ] && output "  - CPU: $cpu_cores cores (recommended: $REC_CPU_CORES)"
    [ "$ram_mb" -lt "$REC_RAM_MB" ] && output "  - RAM: $(get_ram_human) (recommended: 4GB)"
    [ "$disk_gb" -lt "$REC_DISK_GB" ] && output "  - Disk: ${disk_gb}GB (recommended: ${REC_DISK_GB}GB)"
    return 0
  else
    success "System meets recommended requirements!"
    return 0
  fi
}

check_swap() {
  local swap_total=$(get_swap_mb)

  if [ "$swap_total" -eq 0 ]; then
    return 1
  fi

  return 0
}

setup_swap() {
  local swap_size="${1:-2G}"
  local swap_file="/swapfile"

  output "Setting up ${swap_size} swap file..."

  # Check if swap already exists
  if swapon --show=NAME,TYPE | grep -q "$swap_file"; then
    warning "Swap file already exists at $swap_file"
    return 1
  fi

  # Validate swap size format
  if [[ ! "$swap_size" =~ ^[0-9]+[MG]$ ]]; then
    error "Invalid swap size format: $swap_size"
    output "  Use format like: 1G, 2G, 512M, 4G"
    return 1
  fi

  # Create swap file
  output "Creating swap file (this may take a moment)..."
  if command -v fallocate >/dev/null 2>&1; then
    if ! fallocate -l "$swap_size" "$swap_file" 2>/dev/null; then
      output "fallocate failed, using dd instead (slower)..."
      # Convert to MB for dd
      local size_mb
      if [[ "$swap_size" =~ G$ ]]; then
        size_mb=$((${swap_size%G} * 1024))
      else
        size_mb=${swap_size%M}
      fi
      dd if=/dev/zero of="$swap_file" bs=1M count="$size_mb" status=progress
    fi
  else
    # Convert to MB for dd
    local size_mb
    if [[ "$swap_size" =~ G$ ]]; then
      size_mb=$((${swap_size%G} * 1024))
    else
      size_mb=${swap_size%M}
    fi
    dd if=/dev/zero of="$swap_file" bs=1M count="$size_mb" status=progress
  fi

  # Set permissions (600 = owner read/write only)
  chmod 600 "$swap_file"

  # Set up swap
  mkswap "$swap_file"
  swapon "$swap_file"

  # Persist in fstab using standard format
  if ! grep -q "^$swap_file" /etc/fstab; then
    echo "$swap_file swap swap defaults 0 0" >> /etc/fstab
  fi

  # Set swappiness to 10 for production servers (default is 60)
  # Lower values make kernel less likely to use swap
  output "Optimizing swappiness setting..."
  sysctl vm.swappiness=10 2>/dev/null || true

  # Make swappiness persistent
  if ! grep -q "^vm.swappiness" /etc/sysctl.conf 2>/dev/null; then
    echo "vm.swappiness=10" >> /etc/sysctl.conf
    output "Swappiness set to 10 (persistent across reboots)"
  fi

  # Show results
  local swap_mb=$(get_swap_mb)
  success "Swap configured: $(get_swap_human)"
  output "Swappiness: $(cat /proc/sys/vm/swappiness 2>/dev/null || echo 'unknown')"
  output ""
  output "To verify swap is working: free -h"
  output "To remove swap: swapoff $swap_file && rm $swap_file"
  return 0
}

show_system_resources() {
  local cpu_cores=$(get_cpu_cores)
  local ram_human=$(get_ram_human)
  local disk_human=$(get_disk_human)
  local swap_human=$(get_swap_human)

  echo ""
  output "System Resources:"
  output "  ${COLOR_ORANGE}CPU:${COLOR_NC}    $cpu_cores cores"
  output "  ${COLOR_ORANGE}RAM:${COLOR_NC}    $ram_human"
  output "  ${COLOR_ORANGE}Disk:${COLOR_NC}   $disk_human available"
  output "  ${COLOR_ORANGE}Swap:${COLOR_NC}   $swap_human"
}

# Check if system can run Docker (important for Elytra)
check_docker_compatibility() {
  local has_warnings=false

  # Check for virtualization
  if command -v systemd-detect-virt >/dev/null 2>&1; then
    local virt_type
    virt_type=$(systemd-detect-virt 2>/dev/null || echo "unknown")

    case "$virt_type" in
      openvz|lxc|lxc-libvirt)
        warning "Detected $virt_type virtualization - Docker may not work properly"
        output "  Consider using KVM-based virtualization instead"
        has_warnings=true
        ;;
      none|kvm|vmware|microsoft|xen|bochs)
        output "✓ Virtualization type '$virt_type' is compatible with Docker"
        ;;
      *)
        info "Unknown virtualization type: $virt_type"
        ;;
    esac
  fi

  # Check if swap is disabled (affects Docker memory limits)
  local swap_total
  swap_total=$(get_swap_mb)
  if [ "$swap_total" -eq 0 ]; then
    warning "Swap is disabled - Docker containers may not be able to use swap"
    output "  Consider enabling swap for better container stability"
    has_warnings=true
  fi

  # Check cgroup version (cgroup v2 is preferred)
  if [ -f /proc/filesystems ]; then
    if grep -q "cgroup2" /proc/filesystems 2>/dev/null; then
      output "✓ Cgroup v2 is available (recommended for Docker)"
    elif grep -q "cgroup" /proc/filesystems 2>/dev/null; then
      info "Cgroup v1 detected - Docker will work but cgroup v2 is preferred"
    fi
  fi

  if [ "$has_warnings" == true ]; then
    return 1
  fi

  return 0
}

# ------------------ Validation Functions ----------------- #

check_fqdn() {
  local fqdn="$1"

  # Must not be empty
  [ -z "$fqdn" ] && return 1

  # Must contain at least one dot
  [[ "$fqdn" =~ \. ]] || return 1

  # Must not be an IP address
  [[ "$fqdn" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && return 1

  # Basic format validation
  [[ "$fqdn" =~ ^[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9]$ ]] || return 1

  # No consecutive dots
  [[ "$fqdn" =~ \.\. ]] && return 1

  # Not start or end with hyphen
  [[ "$fqdn" =~ ^-|-$ ]] && return 1

  return 0
}

cmd_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Load existing database credentials from previous run
# Usage: load_existing_db_credentials [variable_name]
# Returns 0 if credentials loaded successfully, 1 otherwise
load_existing_db_credentials() {
  local creds_file="/root/.config/pyrodactyl/db-credentials"

  if [ -f "$creds_file" ]; then
    output "Found existing database credentials, loading..." >&2
    local saved_root_pass
    saved_root_pass=$(grep '^root:' "$creds_file" | cut -d':' -f2)

    # Test if saved credentials work
    if mysql -u root -p"${saved_root_pass}" -e "SELECT 1" >/dev/null 2>&1; then
      echo "${saved_root_pass}"
      success "Existing database credentials validated" >&2
      return 0
    else
      error "Saved database credentials don't work!"
      error "MariaDB may have been configured with a different password."
      error "Please set MYSQL_ROOT_PASSWORD environment variable or reset MariaDB"
      exit 1
    fi
  fi
  return 1
}

check_existing_installation() {
  local component="$1"
  local has_existing=false

  if [ "$component" == "panel" ] && [ -d "/var/www/pyrodactyl" ]; then
    warning "Existing panel installation detected at /var/www/pyrodactyl"
    has_existing=true
  elif [ "$component" == "elytra" ] && [ -f "/usr/local/bin/elytra" ]; then
    warning "Existing Elytra installation detected at /usr/local/bin/elytra"
    has_existing=true
  fi

  if [ "$has_existing" == true ]; then
    return 0
  else
    return 1
  fi
}

valid_email() {
  local email="$1"
  local email_regex="^(([A-Za-z0-9]+((\.|\-|\_|\+)?[A-Za-z0-9]?)*[A-Za-z0-9]+)|[A-Za-z0-9]+)@(([A-Za-z0-9]+)+((\.|\-|\_)?([A-Za-z0-9]+)+)*)+\.([A-Za-z]{2,})+$"
  [[ "$email" =~ $email_regex ]]
}

invalid_ip() {
  local ip="$1"
  ip route get "$ip" >/dev/null 2>&1
  echo $?
}

# ------------------ Password Generation ----------------- #

gen_passwd() {
  local length=$1
  local charset='A-Za-z0-9!@#$%^&*()_+'
  tr -dc "$charset" < /dev/urandom | fold -w "$length" | head -n 1
}

# ------------------ GitHub API Functions ----------------- #

get_latest_release() {
  local repo="$1"
  local token="${2:-$GITHUB_TOKEN}"

  local curl_opts=(-sL --max-time 30)
  if [ -n "$token" ]; then
    curl_opts+=(-H "Authorization: Bearer $token")
  fi

  local release_json
  release_json=$(curl "${curl_opts[@]}" "https://api.github.com/repos/$repo/releases/latest" 2>/dev/null)

  if [ -z "$release_json" ] || echo "$release_json" | grep -q '"message":"Not Found"'; then
    return 1
  fi

  echo "$release_json" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/'
}

check_releases_exist() {
  local repo="$1"
  local token="${2:-$GITHUB_TOKEN}"

  local curl_opts=(-sL --max-time 30)
  if [ -n "$token" ]; then
    curl_opts+=(-H "Authorization: Bearer $token")
  fi

  local release_json
  release_json=$(curl "${curl_opts[@]}" "https://api.github.com/repos/$repo/releases/latest" 2>/dev/null)

  if [ -z "$release_json" ] || echo "$release_json" | grep -q '"message"'; then
    return 1
  fi

  local tag_name
  tag_name=$(echo "$release_json" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

  [ -n "$tag_name" ] && [ "$tag_name" != "null" ]
}

# Get the last N releases from a GitHub repository
# Usage: get_recent_releases <repo> [count] [token]
# Returns: List of release tags (one per line), most recent first
get_recent_releases() {
  local repo="$1"
  local count="${2:-4}"
  local token="${3:-$GITHUB_TOKEN}"

  # Ensure jq is available
  if ! cmd_exists jq; then
    error "jq is required but not installed"
    return 1
  fi

  # Request more releases than needed since we filter out drafts/prereleases
  local requested_count=$((count * 2))
  [ "$requested_count" -lt 10 ] && requested_count=10

  local curl_opts=(-sL --max-time 30)
  if [ -n "$token" ]; then
    curl_opts+=(-H "Authorization: Bearer $token")
  fi

  local releases_json
  releases_json=$(curl "${curl_opts[@]}" "https://api.github.com/repos/$repo/releases?per_page=$requested_count" 2>/dev/null)

  if [ -z "$releases_json" ]; then
    return 1
  fi

  # Check for API errors (including Not Found, rate limit, etc.)
  if echo "$releases_json" | grep -q '"message"'; then
    return 1
  fi

  # Extract tag names, exclude drafts and prereleases
  echo "$releases_json" | jq -r '.[] | select(.draft == false and .prerelease == false) | .tag_name' 2>/dev/null | head -n "$count"
}

# Validate a release tag exists for a repository
# Usage: validate_release_tag <repo> <tag> [token]
# Returns: 0 if valid, 1 otherwise
# Outputs: The normalized tag name to stdout on success
validate_release_tag() {
  local repo="$1"
  local tag="$2"
  local token="${3:-$GITHUB_TOKEN}"

  # Normalize tag - add 'v' prefix if missing and user provided x.x.x format
  if [[ "$tag" =~ ^[0-9]+\.[0-9]+\.[0-9]+.*$ ]]; then
    tag="v$tag"
  fi

  # URL encode the tag for the API call
  local encoded_tag
  encoded_tag=$(printf '%s' "$tag" | jq -sRr @uri 2>/dev/null || echo "$tag")

  local curl_opts=(-sL --max-time 30)
  if [ -n "$token" ]; then
    curl_opts+=(-H "Authorization: Bearer $token")
  fi

  local release_json
  release_json=$(curl "${curl_opts[@]}" "https://api.github.com/repos/$repo/releases/tags/$encoded_tag" 2>/dev/null)

  if [ -z "$release_json" ]; then
    return 1
  fi

  # Check for any API error message (Not Found, rate limit, etc.)
  if echo "$release_json" | grep -q '"message"'; then
    return 1
  fi

  # Return the normalized tag
  echo "$tag"
  return 0
}

# Prompt user to select a release version
# For panel: shows last 4 releases, accepts "latest", tag, or "Release <tag>"
# For Elytra: asks latest vs specific, accepts "latest" or "vX.X.X"
# Usage: select_release_version <repo> [component_name] [token]
# Returns: Selected version (tag_name or "latest") via stdout
# User can press Ctrl+C to cancel at any prompt
select_release_version() {
  local repo="$1"
  local component="${2:-panel}"
  local token="${3:-$GITHUB_TOKEN}"

  local releases=()
  local latest=""
  local selection=""
  local valid_selection=false

  # Get latest release
  latest=$(get_latest_release "$repo" "$token")
  if [ -z "$latest" ]; then
    error "Could not fetch latest release information" >&2
    return 1
  fi

  if [ "$component" == "panel" ]; then
    # Panel: Show last 4 releases
    local recent_releases
    recent_releases=$(get_recent_releases "$repo" 4 "$token")

    echo "" >&2
    output "Available releases for ${COLOR_ORANGE}${repo}${COLOR_NC}:" >&2
    echo "" >&2
    output "[${COLOR_ORANGE}latest${COLOR_NC}] Latest release (${latest})" >&2

    while IFS= read -r tag; do
      [ -z "$tag" ] && continue
      releases+=("$tag")
      output "[${COLOR_ORANGE}${tag}${COLOR_NC}] Release ${tag}" >&2
    done <<< "$recent_releases"

    echo "" >&2
    output "You can enter: ${COLOR_ORANGE}latest${COLOR_NC}, a specific tag (e.g., ${COLOR_ORANGE}v1.2.3${COLOR_NC})," >&2
    output "or ${COLOR_ORANGE}Release v1.2.3${COLOR_NC}" >&2
    output "Press Ctrl+C to cancel" >&2
    echo "" >&2

    while [ "$valid_selection" == false ]; do
      echo -n "* Select version: " >&2
      read -r selection

      # Handle empty input
      if [ -z "$selection" ]; then
        error "Please enter a selection" >&2
        continue
      fi

      # Normalize input - handle "Release <tag>" format
      local normalized_selection="$selection"
      normalized_selection=$(echo "$normalized_selection" | sed -E 's/^[Rr]elease[[:space:]]+//')

      # Check for "latest"
      if [[ "$normalized_selection" == "latest" ]]; then
        echo "latest"
        return 0
      fi

      # Add 'v' prefix if user provided x.x.x format
      if [[ "$normalized_selection" =~ ^[0-9]+\.[0-9]+\.[0-9]+.*$ ]]; then
        normalized_selection="v$normalized_selection"
      fi

      # Validate the tag exists
      if validate_release_tag "$repo" "$normalized_selection" "$token" >/dev/null 2>&1; then
        echo "$normalized_selection"
        return 0
      fi

      error "Invalid selection: '$selection' is not a valid release" >&2
      output "Please choose from the list above or enter a valid tag (or press Ctrl+C to cancel)" >&2
    done

  else
    # Elytra: Simple latest vs specific
    echo "" >&2
    output "Elytra is installed from binary releases." >&2
    output "Latest release: ${COLOR_ORANGE}${latest}${COLOR_NC}" >&2
    echo "" >&2
    output "[${COLOR_ORANGE}0${COLOR_NC}] Latest release (${latest})" >&2
    output "[${COLOR_ORANGE}1${COLOR_NC}] Specific version" >&2
    output "Press Ctrl+C to cancel" >&2
    echo "" >&2

    local choice=""
    while [[ "$choice" != "0" && "$choice" != "1" ]]; do
      echo -n "* Select [0-1]: " >&2
      read -r choice

      if [[ "$choice" != "0" && "$choice" != "1" ]]; then
        error "Invalid selection. Please enter 0 or 1." >&2
      fi
    done

    if [ "$choice" == "0" ]; then
      echo "latest"
      return 0
    fi

    # User wants specific version
    echo "" >&2
    output "Enter the version tag you want to install." >&2
    output "Format: ${COLOR_ORANGE}vX.X.X${COLOR_NC} (e.g., v1.0.0, v1.2.3)" >&2
    output "Press Ctrl+C to cancel" >&2
    echo "" >&2

    while [ "$valid_selection" == false ]; do
      echo -n "* Version tag: " >&2
      read -r selection

      if [ -z "$selection" ]; then
        error "Please enter a version tag" >&2
        continue
      fi

      # Normalize - add 'v' prefix if missing and user provided x.x.x format
      local normalized_selection="$selection"
      if [[ "$normalized_selection" =~ ^[0-9]+\.[0-9]+\.[0-9]+.*$ ]]; then
        normalized_selection="v$normalized_selection"
      fi

      # Validate the tag exists
      if validate_release_tag "$repo" "$normalized_selection" "$token" >/dev/null 2>&1; then
        echo "$normalized_selection"
        return 0
      fi

      error "Invalid tag: '$selection' is not a valid release" >&2
      output "Please enter a valid tag (e.g., v1.0.0) or check available releases at:" >&2
      output "  https://github.com/${repo}/releases" >&2
      output "(Press Ctrl+C to cancel)" >&2
    done
  fi
}

validate_github_token() {
  local token="$1"
  local repo="$2"

  # Validate token format
  if [ -z "$token" ] || [ ${#token} -lt 10 ]; then
    error "Invalid token format"
    return 1
  fi

  # Check if token works by accessing the repo
  local response
  response=$(curl -sL -H "Authorization: Bearer $token" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$repo" 2>/dev/null)

  if echo "$response" | grep -q '"message":"Bad credentials"'; then
    error "Invalid GitHub token"
    return 1
  fi

  if echo "$response" | grep -q '"message":"Not Found"'; then
    error "Token cannot access repository $repo"
    error "Ensure the token has 'repo' scope for private repositories"
    return 1
  fi

  return 0
}

get_release_asset_url() {
  local repo="$1"
  local asset_name="$2"
  local token="${3:-$GITHUB_TOKEN}"
  local version="${4:-latest}"

  # Ensure jq is installed
  if ! cmd_exists jq; then
    error "jq is required but not installed"
    error "Please install jq first"
    return 1
  fi

  # Determine API endpoint
  local release_endpoint="latest"
  if [ "$version" != "latest" ]; then
    # URL encode the version tag for the API path
    local encoded_version
    encoded_version=$(printf '%s' "$version" | jq -sRr @uri 2>/dev/null || echo "$version")
    release_endpoint="tags/${encoded_version}"
  fi

  local release_json
  if [ -n "$token" ]; then
    release_json=$(curl -sS \
      --header "Accept: application/vnd.github+json" \
      --header "Authorization: Bearer $token" \
      --header "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$repo/releases/${release_endpoint}" 2>&1)
  else
    release_json=$(curl -sS \
      --header "Accept: application/vnd.github+json" \
      --header "X-GitHub-Api-Version: 2022-11-28" \
      "https://api.github.com/repos/$repo/releases/${release_endpoint}" 2>&1)
  fi

  if [ -z "$release_json" ]; then
    error "Failed to fetch release info from GitHub API (empty response)"
    return 1
  fi

  if echo "$release_json" | grep -q '"message"'; then
    local error_msg
    error_msg=$(echo "$release_json" | jq -r '.message' 2>/dev/null || echo "$release_json")
    error "GitHub API error: $error_msg"
    return 1
  fi

  echo "$release_json" | jq -r ".assets[] | select(.name == \"$asset_name\") | .url" 2>/dev/null
}

download_release_asset() {
  local repo="$1"
  local asset_name="$2"
  local output_path="$3"
  local token="${4:-$GITHUB_TOKEN}"
  local version="${5:-latest}"

  local asset_url
  asset_url=$(get_release_asset_url "$repo" "$asset_name" "$token" "$version")

  if [ -z "$asset_url" ] || [ "$asset_url" == "null" ]; then
    if [ "$version" == "latest" ]; then
      error "Could not find asset '$asset_name' in latest release"
    else
      error "Could not find asset '$asset_name' in release $version"
    fi
    error "Make sure the release exists and the asset is attached to it."
    return 1
  fi

  # Download using GitHub API asset URL with proper headers
  local curl_exit_code=0
  if [ -n "$token" ]; then
    curl --location --fail --silent --show-error --max-time 300 \
      --header "Accept: application/octet-stream" \
      --header "Authorization: Bearer $token" \
      --header "X-GitHub-Api-Version: 2022-11-28" \
      --output "$output_path" \
      "$asset_url" 2>&1 || curl_exit_code=$?
  else
    curl --location --fail --silent --show-error --max-time 300 \
      --header "Accept: application/octet-stream" \
      --output "$output_path" \
      "$asset_url" 2>&1 || curl_exit_code=$?
  fi

  if [ $curl_exit_code -ne 0 ]; then
    error "Failed to download asset (curl exit code: $curl_exit_code)"
    error "Asset URL: $asset_url"
    if [ -n "$token" ]; then
      error "Make sure your GitHub token has 'repo' scope access to $repo"
    else
      error "If this is a private repository, provide a GitHub token with 'repo' scope"
    fi
    return 1
  fi

  if [ ! -f "$output_path" ] || [ ! -s "$output_path" ]; then
    error "Downloaded file is empty or does not exist: $output_path"
    return 1
  fi

  return 0
}

# ------------------ Input Functions ----------------- #

required_input() {
  local __resultvar=$1
  local prompt="$2"
  local error_msg="${3:-This field is required}"
  local default_value="$4"
  local result=""

  while [ -z "$result" ]; do
    echo -n "* $prompt"
    read -r result

    if [ -z "$result" ]; then
      if [ -n "$default_value" ]; then
        result="$default_value"
      else
        error "$error_msg"
      fi
    fi
  done

  eval "$__resultvar=\"$result\""
}

email_input() {
  local __resultvar=$1
  local prompt="$2"
  local error_msg="${3:-Please enter a valid email address}"
  local result=""

  while ! valid_email "$result"; do
    echo -n "* $prompt"
    read -r result

    if ! valid_email "$result"; then
      error "$error_msg"
    fi
  done

  eval "$__resultvar=\"$result\""
}

password_input() {
  local __resultvar=$1
  local prompt="$2"
  local error_msg="${3:-Password cannot be empty}"
  local default_value="$4"
  local result=""

  while [ -z "$result" ]; do
    echo -n "* $prompt"

    while IFS= read -r -s -n1 char; do
      [[ -z $char ]] && { printf '\n'; break; }

      if [[ $char == $'\x7f' ]]; then
        if [ -n "$result" ]; then
          result=${result%?}
          printf '\b \b'
        fi
      else
        result+=$char
        printf '*'
      fi
    done

    if [ -z "$result" ] && [ -n "$default_value" ]; then
      result="$default_value"
    elif [ -z "$result" ]; then
      error "$error_msg"
    fi
  done

  eval "$__resultvar=\"$result\""
}

bool_input() {
  local __resultvar=$1
  local prompt="$2"
  local default="${3:-n}"
  local result=""
  local prompt_suffix=""

  # Set prompt suffix based on default
  if [ "$default" == "y" ]; then
    prompt_suffix="[Y/n] (default: y)"
  else
    prompt_suffix="[y/N] (default: n)"
  fi

  while [[ "$result" != "y" && "$result" != "n" ]]; do
    echo -n "* $prompt $prompt_suffix: "
    read -r result
    result=$(echo "$result" | tr '[:upper:]' '[:lower:]')
    [ -z "$result" ] && result="$default"
  done

  eval "$__resultvar=\"$result\""
}

array_contains_element() {
  local match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

# ------------------ Package Manager Functions ----------------- #

update_repos() {
  local quiet="${1:-false}"
  local args=""

  [ "$quiet" == true ] && args="-qq"

  case "$OS" in
    ubuntu|debian)
      output "Updating package repositories..."
      apt-get update -y $args || {
        error "Failed to update repositories"
        return 1
      }
      ;;
    rocky|almalinux|fedora|rhel|centos)
      # These distros auto-refresh, but we can manually update if needed
      output "Updating package repositories..."
      dnf check-update -y || true  # Returns 100 if updates available, which is OK
      ;;
    arch)
      output "Updating package database..."
      pacman -Sy --noconfirm || true
      ;;
  esac
}

install_packages() {
  local packages="$1"
  local quiet="${2:-false}"
  local args=""

  if [ "$quiet" == true ]; then
    case "$OS" in
      ubuntu|debian) args="-qq" ;;
      *) args="-q" ;;
    esac
  fi

  case "$OS" in
    ubuntu|debian)
      apt-get install -y $args $packages || {
        error "Failed to install packages: $packages"
        return 1
      }
      ;;
    rocky|almalinux|fedora|rhel|centos)
      dnf install -y $args $packages || {
        error "Failed to install packages: $packages"
        return 1
      }
      ;;
    arch)
      pacman -S --noconfirm $packages || {
        error "Failed to install packages: $packages"
        return 1
      }
      ;;
  esac
}

# ------------------ MySQL/MariaDB Functions ----------------- #

configure_mariadb_tcp() {
  output "Configuring MariaDB for TCP connections..."

  # Create MariaDB configuration file to enable TCP connections
  local mariadb_conf_dir=""
  case "$OS" in
    ubuntu|debian)
      mariadb_conf_dir="/etc/mysql/mariadb.conf.d"
      ;;
    rocky|almalinux|fedora|rhel|centos)
      mariadb_conf_dir="/etc/my.cnf.d"
      ;;
    *)
      mariadb_conf_dir="/etc/mysql/conf.d"
      ;;
  esac

  # Ensure the directory exists
  mkdir -p "$mariadb_conf_dir"

  # Create configuration file
  cat > "${mariadb_conf_dir}/99-pyrodactyl.cnf" <<EOF
[mysqld]
bind-address = 0.0.0.0
port = 3306
max_connections = 1000
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 1
innodb_lock_wait_timeout = 50
EOF

  # Restart MariaDB to apply changes
  systemctl restart mariadb || systemctl restart mysql || true

  # Wait for MariaDB to be ready
  local attempts=0
  while ! mysqladmin ping --silent 2>/dev/null; do
    attempts=$((attempts + 1))
    if [ $attempts -gt 30 ]; then
      error "MariaDB failed to start after configuration"
      return 1
    fi
    sleep 1
  done

  success "MariaDB configured for TCP connections"
}

create_db_user() {
  local username="$1"
  local password="$2"
  local host="${3:-127.0.0.1}"

  output "Creating database user '$username'..."

  mysql -u root -e "CREATE USER IF NOT EXISTS '$username'@'$host' IDENTIFIED BY '$password';" || {
    error "Failed to create database user"
    return 1
  }

  mysql -u root -e "FLUSH PRIVILEGES;"
  success "Database user created"
}

grant_all_privileges() {
  local db_name="$1"
  local username="$2"
  local host="${3:-127.0.0.1}"

  output "Granting privileges on '$db_name' to '$username'..."

  mysql -u root -e "GRANT ALL PRIVILEGES ON $db_name.* TO '$username'@'$host' WITH GRANT OPTION;" || {
    error "Failed to grant privileges"
    return 1
  }

  mysql -u root -e "FLUSH PRIVILEGES;"
  success "Privileges granted"
}

create_db() {
  local db_name="$1"
  local username="$2"
  local host="${3:-127.0.0.1}"

  output "Creating database '$db_name'..."

  mysql -u root -e "CREATE DATABASE IF NOT EXISTS $db_name;" || {
    error "Failed to create database"
    return 1
  }

  grant_all_privileges "$db_name" "$username" "$host"
  success "Database created"
}

# ------------------ Firewall Functions ----------------- #

ask_firewall() {
  local __resultvar=$1
  local confirm=""

  case "$OS" in
    ubuntu|debian)
      while [[ "$confirm" != "y" && "$confirm" != "n" ]]; do
        echo -n "* Automatically configure UFW firewall? [y/N]: "
        read -r confirm
        confirm=$(echo "$confirm" | tr '[:upper:]' '[:lower:]')
        [ -z "$confirm" ] && confirm="n"

        if [[ "$confirm" != "y" && "$confirm" != "n" ]]; then
          error "Invalid input. Please enter 'y' or 'n'."
        fi
      done
      [[ "$confirm" == "y" ]] && eval "$__resultvar=true" || eval "$__resultvar=false"
      ;;
    rocky|almalinux|fedora|rhel|centos)
      while [[ "$confirm" != "y" && "$confirm" != "n" ]]; do
        echo -n "* Automatically configure firewalld? [y/N]: "
        read -r confirm
        confirm=$(echo "$confirm" | tr '[:upper:]' '[:lower:]')
        [ -z "$confirm" ] && confirm="n"

        if [[ "$confirm" != "y" && "$confirm" != "n" ]]; then
          error "Invalid input. Please enter 'y' or 'n'."
        fi
      done
      [[ "$confirm" == "y" ]] && eval "$__resultvar=true" || eval "$__resultvar=false"
      ;;
    *)
      warning "Automatic firewall configuration not supported for $OS"
      eval "$__resultvar=false"
      ;;
  esac
}

ask_game_ports() {
  local __start_var=$1
  local __end_var=$2
  local start_port=""
  local end_port=""

  echo ""
  output "Configure game server port range"
  output "The following port ranges will be opened for popular games:"
  output "  - Minecraft: 25565-25665"
  output "  - Source Engine (CS:GO, TF2, GMod): 27015-27150"
  output "  - Unreal Engine (ARK, Satisfactory): 7777-8000"
  output "  - Rust: 28015-28025"
  output "  - Valheim: 2456-2466"
  output "  - FiveM/GTA: 30120-30130"
  output "  - General range: 27015-28025"

  # Validate start port
  while true; do
    echo -n "* Start port [27015]: "
    read -r start_port
    start_port=${start_port:-27015}

    if ! [[ "$start_port" =~ ^[0-9]+$ ]]; then
      error "Invalid input. Please enter a numeric port value."
    elif [ "$start_port" -lt 1 ] || [ "$start_port" -gt 65535 ]; then
      error "Invalid port. Port must be between 1 and 65535."
    else
      break
    fi
  done

  # Validate end port
  while true; do
    echo -n "* End port [28025]: "
    read -r end_port
    end_port=${end_port:-28025}

    if ! [[ "$end_port" =~ ^[0-9]+$ ]]; then
      error "Invalid input. Please enter a numeric port value."
    elif [ "$end_port" -lt 1 ] || [ "$end_port" -gt 65535 ]; then
      error "Invalid port. Port must be between 1 and 65535."
    elif [ "$end_port" -le "$start_port" ]; then
      error "End port must be greater than start port ($start_port)."
    else
      break
    fi
  done

  eval "$__start_var=$start_port"
  eval "$__end_var=$end_port"
}

# Comprehensive game port configuration for popular games
configure_game_ports() {
  local start_port="${1:-27015}"

  output "Configuring game server ports starting from $start_port..."

  # Calculate port ranges based on start port
  local minecraft_start=$start_port
  local minecraft_end=$((start_port + 100))
  local source_start=$((minecraft_end + 1))
  local source_end=$((source_start + 135))
  local unreal_start=$((source_end + 1))
  local unreal_end=$((unreal_start + 200))
  local rust_start=$((unreal_end + 1))
  local rust_end=$((rust_start + 10))
  local valheim_start=$((rust_end + 1))
  local valheim_end=$((valheim_start + 10))
  local fivem_start=$((valheim_end + 1))
  local fivem_end=$((fivem_start + 10))

  output "Port allocation:"
  output "  Minecraft: $minecraft_start-$minecraft_end"
  output "  Source Engine: $source_start-$source_end"
  output "  ARK/Satisfactory: $unreal_start-$unreal_end"
  output "  Rust: $rust_start-$rust_end"
  output "  Valheim: $valheim_start-$valheim_end"
  output "  FiveM: $fivem_start-$fivem_end"

  # Return the full range
  GAME_PORT_START=$start_port
  GAME_PORT_END=$fivem_end
}

install_firewall() {
  case "$OS" in
    ubuntu|debian)
      if ! cmd_exists ufw; then
        output "Installing UFW..."
        apt-get install -y ufw
      fi
      ufw --force enable
      success "UFW enabled"
      ;;
    rocky|almalinux|fedora|rhel|centos)
      if ! cmd_exists firewall-cmd; then
        output "Installing firewalld..."
        dnf install -y firewalld
      fi
      systemctl enable --now firewalld
      success "Firewalld enabled"
      ;;
  esac
}

firewall_allow_ports() {
  local ports="$1"

  case "$OS" in
    ubuntu|debian)
      for port in $ports; do
        if [[ "$port" == *":"* ]]; then
          ufw allow "$port/tcp"
          ufw allow "$port/udp"
        else
          ufw allow "$port/tcp"
          ufw allow "$port/udp"
        fi
      done
      ufw --force reload
      ;;
    rocky|almalinux|fedora|rhel|centos)
      for port in $ports; do
        if [[ "$port" == *":"* ]]; then
          firewall-cmd --zone=public --add-port="$port"/tcp --permanent
          firewall-cmd --zone=public --add-port="$port"/udp --permanent
        else
          firewall-cmd --zone=public --add-port="$port"/tcp --permanent
          firewall-cmd --zone=public --add-port="$port"/udp --permanent
        fi
      done
      firewall-cmd --reload
      ;;
  esac
}

configure_firewall_rules() {
  local http="${1:-true}"
  local https="${2:-true}"
  local elytra="${3:-false}"
  local game_start="${4:-0}"
  local game_end="${5:-0}"

  output "Configuring firewall rules..."

  local ports="22"  # SSH is always allowed

  [ "$http" == true ] && ports="$ports 80"
  [ "$https" == true ] && ports="$ports 443"
  [ "$elytra" == true ] && ports="$ports 8080 2022"

  # Always open specific game port ranges for comprehensive game support
  output "Opening game server ports..."
  output "  • 25565-25665 (Minecraft)"
  output "  • 27015-27150 (Source Engine - CS:GO, TF2, GMod)"
  output "  • 7777-8000 (Unreal Engine - ARK, Satisfactory)"
  output "  • 28015-28025 (Rust)"
  output "  • 2456-2466 (Valheim)"
  output "  • 30120-30130 (FiveM/GTA)"

  ports="$ports 25565:25665 27015:27150 7777:8000 28015:28025 2456:2466 30120:30130"

  if [ "$game_start" != "0" ] && [ "$game_end" != "0" ]; then
    ports="$ports ${game_start}:${game_end}"
  fi

  firewall_allow_ports "$ports"
  success "Firewall configured"
}

# ------------------ Virtualization Check ----------------- #

check_virt() {
  output "Checking virtualization..."

  if ! cmd_exists virt-what; then
    install_packages "virt-what" true
  fi

  export PATH="$PATH:/sbin:/usr/sbin"

  local virt_type
  virt_type=$(virt-what 2>/dev/null | head -1)

  case "$virt_type" in
    openvz|lxc)
      warning "Unsupported virtualization detected: $virt_type"
      warning "Docker may not work properly in this environment"
      local confirm=""
      while [[ "$confirm" != "y" && "$confirm" != "n" ]]; do
        echo -n "* Continue anyway? [y/N]: "
        read -r confirm
        confirm=$(echo "$confirm" | tr '[:upper:]' '[:lower:]')
        [ -z "$confirm" ] && confirm="n"

        if [[ "$confirm" != "y" && "$confirm" != "n" ]]; then
          error "Invalid input. Please enter 'y' or 'n'."
        fi
      done

      if [[ "$confirm" == "n" ]]; then
        exit 1
      fi
      ;;
    *)
      [ -n "$virt_type" ] && info "Virtualization: $virt_type"
      ;;
  esac

  success "Virtualization check complete"
}

# ------------------ PHP Functions ----------------- #

install_composer() {
  if cmd_exists composer; then
    output "Composer is already installed"
    return 0
  fi

  output "Installing Composer..."

  php -r "copy('https://getcomposer.org/installer', '/tmp/composer-setup.php');"
  php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer

  if cmd_exists composer; then
    success "Composer installed"
  else
    error "Failed to install Composer"
    return 1
  fi
}

ensure_php_default() {
  local restart_fpm="${1:-false}"

  output "Ensuring PHP ${PHP_VERSION} is set as default..."
  update-alternatives --set php /usr/bin/php${PHP_VERSION} 2>/dev/null || true
  update-alternatives --set phar /usr/bin/phar${PHP_VERSION} 2>/dev/null || true
  update-alternatives --set phar.phar /usr/bin/phar.phar${PHP_VERSION} 2>/dev/null || true

  if [ "$restart_fpm" == "true" ]; then
    output "Restarting PHP-FPM..."
    systemctl restart php${PHP_VERSION}-fpm 2>/dev/null || systemctl restart php-fpm 2>/dev/null || true
  fi

  success "PHP ${PHP_VERSION} is set as default"
}

install_nodejs() {
  if cmd_exists node; then
    output "Node.js is already installed ($(node --version))"
    return 0
  fi

  output "Installing Node.js..."

  case "$OS" in
    ubuntu|debian)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      install_packages "nodejs"
      ;;
    rocky|almalinux|fedora|rhel|centos)
      # Install Node.js from NodeSource on RHEL-based systems
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      install_packages "nodejs"
      ;;
    *)
      error "Unsupported OS for Node.js installation"
      return 1
      ;;
  esac

  if cmd_exists node; then
    success "Node.js installed ($(node --version))"
  else
    error "Failed to install Node.js"
    return 1
  fi
}

install_pnpm() {
  if cmd_exists pnpm; then
    output "pnpm is already installed ($(pnpm --version))"
    return 0
  fi

  output "Installing pnpm..."

  # Install pnpm globally using npm
  npm install -g pnpm

  # Ensure npm global bin is in PATH
  export PATH="$PATH:$(npm bin -g 2>/dev/null || echo '/usr/local/bin')"
  export PATH="$PATH:$(npm config get prefix 2>/dev/null)/bin"

  if cmd_exists pnpm; then
    success "pnpm installed ($(pnpm --version))"
  else
    error "Failed to install pnpm"
    return 1
  fi
}

build_panel_assets() {
  local install_dir="${1:-$INSTALL_DIR}"

  if [ -z "$install_dir" ]; then
    error "Install directory not specified for asset building"
    return 1
  fi

  cd "$install_dir" || return 1

  # Install Node.js if needed
  install_nodejs

  # Install pnpm if needed
  install_pnpm

  # Install JavaScript dependencies
  output "Installing JavaScript dependencies..."
  pnpm install

  # Build frontend assets
  output "Building frontend assets..."
  pnpm build

  success "Frontend assets built successfully"
}

install_phpmyadmin() {
  print_flame "Installing phpMyAdmin"

  # Generate random password for phpMyAdmin
  PHPMYADMIN_PASSWORD="${PHPMYADMIN_PASSWORD:-$(gen_passwd 32)}"
  export PHPMYADMIN_PASSWORD

  export DEBIAN_FRONTEND=noninteractive

  # Pre-configure phpMyAdmin debconf settings
  echo 'phpmyadmin phpmyadmin/dbconfig-install boolean true' | debconf-set-selections
  echo "phpmyadmin phpmyadmin/app-password-confirm password ${PHPMYADMIN_PASSWORD}" | debconf-set-selections
  echo "phpmyadmin phpmyadmin/mysql/admin-pass password ${MYSQL_ROOT_PASSWORD}" | debconf-set-selections
  echo "phpmyadmin phpmyadmin/mysql/app-pass password ${PHPMYADMIN_PASSWORD}" | debconf-set-selections
  echo 'phpmyadmin phpmyadmin/reconfigure-webserver multiselect' | debconf-set-selections

  output "Installing phpMyAdmin and PHP extensions..."
  install_packages "phpmyadmin php${PHP_VERSION}-mbstring php${PHP_VERSION}-zip php${PHP_VERSION}-gd php${PHP_VERSION}-curl"

  output "Creating phpMyAdmin database user..."
  mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "
    CREATE USER IF NOT EXISTS 'phpmyadmin'@'localhost' IDENTIFIED BY '${PHPMYADMIN_PASSWORD}';
    CREATE USER IF NOT EXISTS 'phpmyadmin'@'127.0.0.1' IDENTIFIED BY '${PHPMYADMIN_PASSWORD}';
    CREATE USER IF NOT EXISTS 'phpmyadmin'@'%' IDENTIFIED BY '${PHPMYADMIN_PASSWORD}';
    GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'localhost' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'127.0.0.1' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO 'phpmyadmin'@'%' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
  " 2>/dev/null || warning "Could not create phpMyAdmin user (may already exist)"

  # Save credentials to file
  mkdir -p /root/.config/pyrodactyl
  echo "phpmyadmin:${PHPMYADMIN_PASSWORD}" >> /root/.config/pyrodactyl/db-credentials

  output "Setting up phpMyAdmin configuration..."
  cat > /etc/phpmyadmin/conf.d/99-custom.php << 'PHPEOF'
<?php
# Custom phpMyAdmin configuration for Pyrodactyl
$cfg['Servers'][$i]['AllowNoPassword'] = false;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['LoginCookieValidity'] = 3600;
$cfg['LoginCookieStore'] = 0;
PHPEOF

  output "Configuring nginx for phpMyAdmin..."

  # Get phpMyAdmin config
  local phpmyadmin_config="/etc/nginx/sites-available/phpmyadmin.conf"
  if ! get_config "phpmyadmin.conf" "$phpmyadmin_config"; then
    error "Failed to get phpMyAdmin nginx configuration"
    return 1
  fi

  # Replace PHP_VERSION placeholder
  sed -i "s/<PHP_VERSION>/${PHP_VERSION}/g" "$phpmyadmin_config"

  ln -sf /etc/nginx/sites-available/phpmyadmin.conf /etc/nginx/sites-enabled/phpmyadmin.conf

  output "Restarting services..."
  systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true

  success "phpMyAdmin installed and accessible at http://$(hostname -I | awk '{print $1}'):8081"
}

setup_database_host() {
  local panel_fqdn="${1:-127.0.0.1}"
  local db_host_name="${2:-Local Database Host}"
  local db_host_user="${3:-dbhost}"
  local db_host_pass="${4:-dbhostpassword}"
  local db_host_port="${5:-3306}"

  print_flame "Setting up Database Host"

  # Create database user if it doesn't exist
  output "Creating database host user..."
  mysql -u root -p"${MYSQL_ROOT_PASSWORD}" -e "
    CREATE USER IF NOT EXISTS '${db_host_user}'@'127.0.0.1' IDENTIFIED BY '${db_host_pass}';
    CREATE USER IF NOT EXISTS '${db_host_user}'@'%' IDENTIFIED BY '${db_host_pass}';
    GRANT ALL PRIVILEGES ON *.* TO '${db_host_user}'@'127.0.0.1' WITH GRANT OPTION;
    GRANT ALL PRIVILEGES ON *.* TO '${db_host_user}'@'%' WITH GRANT OPTION;
    FLUSH PRIVILEGES;
  " 2>/dev/null || warning "Could not create database host user (may already exist)"

  # Use Laravel's HostCreationService to create the database host
  output "Creating database host in panel..."

  cd "$INSTALL_DIR" || return 1

  local tinker_output
  tinker_output=$(php artisan tinker --execute="
use Pterodactyl\\Services\\Databases\\Hosts\\HostCreationService;
try {
    app(HostCreationService::class)->handle([
        'name' => '${db_host_name}',
        'host' => '${panel_fqdn}',
        'port' => ${db_host_port},
        'username' => '${db_host_user}',
        'password' => '${db_host_pass}',
    ]);
    echo 'Database host created successfully';
} catch (\\Exception \$e) {
    echo 'Error: ' . \$e->getMessage();
}
" 2>&1)

  if echo "$tinker_output" | grep -q "Database host created successfully"; then
    success "Database host '${db_host_name}' configured successfully"
  else
    error "Could not create database host"
    output "Error output: $tinker_output"
    warning "You may need to create the database host manually in the panel"
  fi
}

php_fpm_conf() {
  output "Configuring PHP-FPM..."

  local config_file="/etc/php-fpm.d/www-pyrodactyl.conf"

  # Download or copy config
  if ! get_config "www-pyrodactyl.conf" "$config_file"; then
    exit 1
  fi

  # Replace placeholders in downloaded config
  sed -i "s|<user>|$WEBUSER|g" "$config_file"
  sed -i "s|<group>|$WEBGROUP|g" "$config_file"

  systemctl enable php-fpm
  systemctl restart php-fpm

  success "PHP-FPM configured"
}

get_php_socket() {
  case "$OS" in
    ubuntu|debian)
      echo "/run/php/php${PHP_VERSION}-fpm.sock"
      ;;
    rocky|almalinux|fedora|rhel|centos)
      echo "/run/php-fpm/www-pyrodactyl.sock"
      ;;
    *)
      echo "/run/php/php${PHP_VERSION}-fpm.sock"
      ;;
  esac
}

# ------------------ Nginx Functions ----------------- #

install_nginx_config() {
  local fqdn="$1"
  local php_socket="$2"
  local ssl="${3:-false}"
  local cert_path="${4:-}"
  local key_path="${5:-}"

  output "Installing Nginx configuration..."

  local config_file="/etc/nginx/sites-available/pyrodactyl.conf"

  if [ "$ssl" == true ] && [ -n "$cert_path" ] && [ -n "$key_path" ]; then
    # Get SSL config
    if ! get_config "nginx_ssl.conf" "$config_file"; then
      exit 1
    fi
    # Replace placeholders
    sed -i "s|<domain>|$fqdn|g" "$config_file"
    sed -i "s|<cert_path>|$cert_path|g" "$config_file"
    sed -i "s|<key_path>|$key_path|g" "$config_file"
    sed -i "s|<php_socket>|$php_socket|g" "$config_file"
  else
    # Get HTTP config
    if ! get_config "nginx.conf" "$config_file"; then
      exit 1
    fi
    # Replace placeholders
    sed -i "s|<domain>|$fqdn|g" "$config_file"
    sed -i "s|<php_socket>|$php_socket|g" "$config_file"
  fi

  # Enable site
  mkdir -p /etc/nginx/sites-enabled
  ln -sf "$config_file" /etc/nginx/sites-enabled/pyrodactyl.conf

  # Remove default site
  rm -f /etc/nginx/sites-enabled/default

  # Test and reload
  nginx -t && systemctl reload nginx

  success "Nginx configured"
}


# Setup certbot automatic renewal with service restart hooks

# Verify certbot renewal configuration

# ------------------ Redis Functions ----------------- #

enable_redis() {
  case "$OS" in
    ubuntu|debian)
      systemctl enable redis-server
      systemctl start redis-server
      ;;
    rocky|almalinux|fedora|rhel|centos|arch)
      systemctl enable redis
      systemctl start redis
      ;;
  esac
}

# ------------------ SELinux Functions ----------------- #

selinux_allow() {
  if cmd_exists setsebool; then
    output "Configuring SELinux..."
    setsebool -P httpd_can_network_connect 1 2>/dev/null || true
    setsebool -P httpd_execmem 1 2>/dev/null || true
    success "SELinux configured"
  fi
}

# ------------------ Cron Functions ----------------- #

insert_cronjob() {
  output "Installing cron job..."

  (crontab -l 2>/dev/null | grep -v "schedule:run"; echo "* * * * * php /var/www/pyrodactyl/artisan schedule:run >> /dev/null 2>&1") | crontab -

  success "Cron job installed"
}

# ------------------ Queue Worker Functions ----------------- #

install_pyroq() {
  output "Installing queue worker service..."

  # Get service file
  if ! get_config "pyroq.service" "/etc/systemd/system/pyroq.service"; then
    exit 1
  fi

  # Replace placeholder with actual user
  sed -i "s|<user>|$WEBUSER|g" /etc/systemd/system/pyroq.service

  systemctl daemon-reload
  systemctl enable pyroq
  systemctl start pyroq

  # Wait for service to start
  sleep 2

  # Verify installation
  if ! systemctl is-active --quiet pyroq 2>/dev/null; then
    warning "Queue worker service failed to start - attempting restart..."
    systemctl restart pyroq
    sleep 2

    if ! systemctl is-active --quiet pyroq 2>/dev/null; then
      warning "Queue worker service failed to start. Check logs with: journalctl -u pyroq"
    fi
  fi

  success "Queue worker installed"
}

# Verify queue worker is running and healthy
verify_pyroq() {
  local panel_dir="${1:-$INSTALL_DIR}"
  local has_errors=false

  # Check if service is active
  if ! systemctl is-active --quiet pyroq 2>/dev/null; then
    warning "Queue worker (pyroq) is not running"
    has_errors=true
  else
    output "✓ Queue worker (pyroq) is running"
  fi

  # Check if service is enabled
  if ! systemctl is-enabled --quiet pyroq 2>/dev/null; then
    warning "Queue worker (pyroq) is not enabled to start on boot"
    has_errors=true
  else
    output "✓ Queue worker (pyroq) is enabled"
  fi

  # Check for failed jobs if panel is installed
  if [ -f "$panel_dir/artisan" ]; then
    local failed_jobs
    failed_jobs=$(cd "$panel_dir" && php artisan queue:failed 2>/dev/null | wc -l)
    if [ "$failed_jobs" -gt 0 ]; then
      warning "There are failed jobs in the queue: $failed_jobs"
      output "  Run '${COLOR_ORANGE}php artisan queue:retry all${COLOR_NC}' to retry failed jobs"
      has_errors=true
    else
      output "✓ No failed jobs in queue"
    fi
  fi

  if [ "$has_errors" == true ]; then
    return 1
  fi

  return 0
}

# Get queue worker status summary
get_pyroq_status() {
  local status="unknown"
  local enabled="unknown"

  if systemctl is-active --quiet pyroq 2>/dev/null; then
    status="running"
  else
    status="stopped"
  fi

  if systemctl is-enabled --quiet pyroq 2>/dev/null; then
    enabled="enabled"
  else
    enabled="disabled"
  fi

  echo "Queue worker: $status ($enabled)"
}

# Restart queue worker and verify
restart_pyroq() {
  output "Restarting queue worker..."

  systemctl restart pyroq 2>/dev/null || {
    error "Failed to restart queue worker"
    return 1
  }

  # Wait a moment for service to start
  sleep 2

  # Verify it's running
  if systemctl is-active --quiet pyroq 2>/dev/null; then
    success "Queue worker restarted successfully"
    return 0
  else
    error "Queue worker failed to start after restart"
    return 1
  fi
}

# ------------------ Auto-Updater Functions ----------------- #

install_auto_updater_panel() {
  output "Installing Panel auto-updater..."

  mkdir -p /etc/pyrodactyl

  # Get auto-update script
  if ! get_script "installers" "auto-update-panel" "/usr/local/bin/pyrodactyl-auto-update-panel.sh"; then
    error "Failed to get auto-update script"
    exit 1
  fi

  # Auto-detect update method based on installation type
  local update_method="releases"
  if [ -d "/var/www/pyrodactyl/.git" ]; then
    update_method="git"
    output "Detected git-based installation - will use git for updates"
  else
    output "Detected release-based installation - will check GitHub releases"
  fi

  # Create config
  echo "PANEL_REPO=\"${PANEL_REPO:-pyrodactyl-oss/pyrodactyl}\"" > /etc/pyrodactyl/auto-update-panel.env
  echo "GITHUB_TOKEN=\"${GITHUB_TOKEN:-}\"" >> /etc/pyrodactyl/auto-update-panel.env
  echo "UPDATE_METHOD=\"${update_method}\"" >> /etc/pyrodactyl/auto-update-panel.env
  echo "PANEL_REPO_PRIVATE=\"${PANEL_REPO_PRIVATE:-false}\"" >> /etc/pyrodactyl/auto-update-panel.env
  chmod 600 /etc/pyrodactyl/auto-update-panel.env

  # Get systemd service
  if ! get_config "auto-update-panel.service" "/etc/systemd/system/pyrodactyl-panel-auto-update.service"; then
    exit 1
  fi

  # Get systemd timer
  if ! get_config "auto-update-panel.timer" "/etc/systemd/system/pyrodactyl-panel-auto-update.timer"; then
    exit 1
  fi

  systemctl daemon-reload
  systemctl enable --now pyrodactyl-panel-auto-update.timer

  success "Panel auto-updater installed"
}

install_auto_updater_elytra() {
  output "Installing Elytra auto-updater..."

  mkdir -p /etc/pyrodactyl

  # Get auto-update script
  if ! get_script "installers" "auto-update-elytra" "/usr/local/bin/pyrodactyl-auto-update-elytra.sh"; then
    error "Failed to get auto-update script"
    exit 1
  fi

  # Elytra always uses release-based updates (distributed as binary)
  output "Elytra uses release-based updates"

  # Create config
  echo "ELYTRA_REPO=\"${ELYTRA_REPO:-pyrohost/elytra}\"" > /etc/pyrodactyl/auto-update-elytra.env
  echo "GITHUB_TOKEN=\"${GITHUB_TOKEN:-}\"" >> /etc/pyrodactyl/auto-update-elytra.env
  echo "UPDATE_METHOD=\"releases\"" >> /etc/pyrodactyl/auto-update-elytra.env
  echo "ELYTRA_REPO_PRIVATE=\"${ELYTRA_REPO_PRIVATE:-false}\"" >> /etc/pyrodactyl/auto-update-elytra.env
  chmod 600 /etc/pyrodactyl/auto-update-elytra.env

  # Get systemd service
  if ! get_config "auto-update-elytra.service" "/etc/systemd/system/pyrodactyl-elytra-auto-update.service"; then
    exit 1
  fi

  # Get systemd timer
  if ! get_config "auto-update-elytra.timer" "/etc/systemd/system/pyrodactyl-elytra-auto-update.timer"; then
    exit 1
  fi

  systemctl daemon-reload
  systemctl enable --now pyrodactyl-elytra-auto-update.timer

  success "Elytra auto-updater installed"
}

remove_auto_updater_panel() {
  output "Removing Panel auto-updater..."

  systemctl stop pyrodactyl-panel-auto-update.timer 2>/dev/null || true
  systemctl disable pyrodactyl-panel-auto-update.timer 2>/dev/null || true

  rm -f /etc/systemd/system/pyrodactyl-panel-auto-update.service
  rm -f /etc/systemd/system/pyrodactyl-panel-auto-update.timer
  rm -f /usr/local/bin/pyrodactyl-auto-update-panel.sh
  rm -f /etc/pyrodactyl/auto-update-panel.conf
  rm -f /etc/pyrodactyl/auto-update-panel.env

  systemctl daemon-reload

  success "Panel auto-updater removed"
}

remove_auto_updater_elytra() {
  output "Removing Elytra auto-updater..."

  systemctl stop pyrodactyl-elytra-auto-update.timer 2>/dev/null || true
  systemctl disable pyrodactyl-elytra-auto-update.timer 2>/dev/null || true

  rm -f /etc/systemd/system/pyrodactyl-elytra-auto-update.service
  rm -f /etc/systemd/system/pyrodactyl-elytra-auto-update.timer
  rm -f /usr/local/bin/pyrodactyl-auto-update-elytra.sh
  rm -f /etc/pyrodactyl/auto-update-elytra.conf
  rm -f /etc/pyrodactyl/auto-update-elytra.env

  systemctl daemon-reload

  success "Elytra auto-updater removed"
}

# ------------------ Script Execution Functions ----------------- #

run_ui() {
  local script_name="$1"
  get_script "ui" "$script_name"
}

run_installer() {
  local script_name="$1"
  get_script "installers" "$script_name"
}

update_lib_source() {
  GITHUB_URL="$GITHUB_BASE_URL/$GITHUB_SOURCE"
  source_lib "lib"
}

# Helper function to download or copy config files
get_config() {
  local config_name="$1"
  local output_path="$2"

  # Download from GitHub
  if ! curl -fsSL -o "$output_path" "$GITHUB_URL/configs/$config_name" 2>/dev/null; then
    error "Failed to download config: $config_name"
    return 1
  fi
  chmod 644 "$output_path" 2>/dev/null || true
  return 0
}

# Helper function to get script (UI, installer, or config)
# Usage: get_script <type> <name> [output_path]
# type: ui, installers, lib, configs
# If output_path is provided, copies/saves there; otherwise executes directly
get_script() {
  local script_type="$1"  # ui, installers, lib, configs
  local script_name="$2"
  local output_path="${3:-}"  # optional

  # Download from GitHub
  if [ -n "$output_path" ]; then
    if ! curl -fsSL -o "$output_path" "$GITHUB_URL/$script_type/$script_name.sh" 2>/dev/null; then
      error "Failed to download script: $script_name"
      return 1
    fi
    chmod 755 "$output_path" 2>/dev/null || true
    return 0
  else
    # Execute directly
    bash <(curl -sSL "$GITHUB_URL/$script_type/$script_name.sh")
    return $?
  fi
}

# Helper function to source a library script
source_lib() {
  local lib_name="$1"

  # Download and source
  local temp_lib
  temp_lib=$(mktemp)
  if ! curl -fsSL -o "$temp_lib" "$GITHUB_URL/lib/$lib_name.sh" 2>/dev/null; then
    error "Failed to download library: $lib_name"
    rm -f "$temp_lib"
    return 1
  fi
  # shellcheck source=/dev/null
  source "$temp_lib"
  local exit_code=$?
  rm -f "$temp_lib"
  return $exit_code
}

# ------------------ Docker Functions ----------------- #

install_docker() {
  print_flame "Installing Docker"

  if cmd_exists docker; then
    output "Docker is already installed, skipping..."
    return 0
  fi

  output "Installing Docker CE..."

  case "$OS" in
    ubuntu|debian)
      # Remove old versions
      apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

      # Install prerequisites
      install_packages "apt-transport-https ca-certificates curl gnupg lsb-release"

      # Add Docker GPG key
      mkdir -p /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

      # Add repository
      echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
        $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

      update_repos true
      install_packages "docker-ce docker-ce-cli containerd.io docker-compose-plugin"
      ;;

    rocky|almalinux|fedora|rhel|centos)
      install_packages "yum-utils"
      yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
      install_packages "docker-ce docker-ce-cli containerd.io docker-compose-plugin"
      ;;
  esac

  # Start Docker
  systemctl start docker
  systemctl enable docker

  # Check virtualization
  check_virt

  success "Docker installed and started"
}

# ------------------ Rustic Functions ----------------- #

install_rustic() {
  print_flame "Installing Rustic"

  if cmd_exists rustic; then
    output "Rustic is already installed, skipping..."
    return 0
  fi

  output "Installing rustic backup tool..."

  local arch
  arch=$(uname -m)
  [[ $arch == x86_64 ]] && arch=x86_64 || arch=aarch64

  # Fetch latest release version from GitHub
  local rustic_version
  rustic_version=$(curl -sSL "https://api.github.com/repos/rustic-rs/rustic/releases/latest" | jq -r '.tag_name' 2>/dev/null || echo "")

  if [ -z "$rustic_version" ] || [ "$rustic_version" == "null" ]; then
    warning "Could not fetch latest rustic version, falling back to v0.11.0"
    rustic_version="v0.11.0"
  fi

  output "Downloading rustic ${rustic_version}..."
  local rustic_url="https://github.com/rustic-rs/rustic/releases/download/${rustic_version}/rustic-${rustic_version}-${arch}-unknown-linux-musl.tar.gz"

  curl -fsSL -o /tmp/rustic.tar.gz "$rustic_url" || {
    error "Failed to download rustic"
    return 1
  }

  tar -xzf /tmp/rustic.tar.gz -C /usr/local/bin rustic
  chmod +x /usr/local/bin/rustic
  rm -f /tmp/rustic.tar.gz

  success "Rustic installed successfully"
}

# ------------------ System Spec Functions ----------------- #

# Note: Use get_ram_mb() and get_disk_gb() from System Resource Functions section instead
# These are kept for backward compatibility with existing code
get_system_memory() {
  get_ram_mb
}

get_system_disk() {
  # Get available disk space in MB for /var/lib/pyrodactyl or root
  local disk_gb
  if [ -d "/var/lib/pyrodactyl" ]; then
    disk_gb=$(df -BG /var/lib/pyrodactyl | awk 'NR==2 {gsub(/G/,""); print $4}')
  else
    disk_gb=$(df -BG / | awk 'NR==2 {gsub(/G/,""); print $4}')
  fi
  # Convert GB to MB
  echo $((disk_gb * 1024))
}

# ------------------ Minecraft Server Creation ----------------- #

create_minecraft_server() {
  local panel_url="$1"
  local api_key="$2"
  local node_id="${3:-1}"
  local location_id="${4:-1}"
  local allocation_id="$5"

  print_flame "Creating Minecraft Server"

  output "Creating Minecraft server via API..."

  # Build JSON with jq to avoid formatting issues
  local server_json
  if [ -n "$allocation_id" ] && [ "$allocation_id" != "null" ]; then
    # Use specific allocation - don't include deploy section
    server_json=$(jq -n \
      --arg name "Minecraft Vanilla Server" \
      --arg desc "Automatically created Minecraft Vanilla Server" \
      --argjson user 1 \
      --argjson egg 7 \
      --arg docker_image "ghcr.io/pterodactyl/yolks:java_17" \
      --arg startup 'java -Xms128M -Xmx4096M -jar {{SERVER_JARFILE}}' \
      --argjson allocation_id "$allocation_id" \
      '{
        name: $name,
        description: $desc,
        user: $user,
        egg: $egg,
        docker_image: $docker_image,
        startup: $startup,
        environment: {
          SERVER_JARFILE: "server.jar",
          VANILLA_VERSION: "latest"
        },
        limits: {
          memory: 4096,
          swap: 0,
          disk: 32768,
          io: 500,
          cpu: 400
        },
        feature_limits: {
          databases: 0,
          allocations: 1,
          backups: 0
        },
        allocation: {
          default: $allocation_id
        },
        start_on_completion: false,
        skip_scripts: false,
        oom_disabled: false
      }')
  else
    # Auto-deploy to location
    server_json=$(jq -n \
      --arg name "Minecraft Vanilla Server" \
      --arg desc "Automatically created Minecraft Vanilla Server" \
      --argjson user 1 \
      --argjson egg 6 \
      --arg docker_image "ghcr.io/pterodactyl/yolks:java_17" \
      --arg startup 'java -Xms128M -Xmx4096M -jar {{SERVER_JARFILE}}' \
      --argjson location_id "$location_id" \
      '{
        name: $name,
        description: $desc,
        user: $user,
        egg: $egg,
        docker_image: $docker_image,
        startup: $startup,
        environment: {
          SERVER_JARFILE: "server.jar",
          VANILLA_VERSION: "latest"
        },
        limits: {
          memory: 4096,
          swap: 0,
          disk: 32768,
          io: 500,
          cpu: 400
        },
        feature_limits: {
          databases: 0,
          allocations: 1,
          backups: 0
        },
        deploy: {
          locations: [$location_id],
          dedicated_ip: false,
          port_range: []
        },
        start_on_completion: false,
        skip_scripts: false,
        oom_disabled: false
      }')
  fi

  # Wait for API to be ready
  output "Waiting for API to be ready..."
  output "DEBUG: Checking API at ${panel_url}/api/application/users"
  output "DEBUG: Using node_id=${node_id}, location_id=${location_id}, allocation_id=${allocation_id}"
  local api_ready=false
  local attempts=0
  while [ "$api_ready" == false ] && [ $attempts -lt 30 ]; do
    local api_test
    local http_code
    api_test=$(curl -s -L -w "\n%{http_code}" -H "Authorization: Bearer $api_key" \
      -H "Accept: Application/vnd.pterodactyl.v1+json" \
      "${panel_url}/api/application/users" 2>/dev/null)

    http_code=$(echo "$api_test" | tail -n1)
    api_test=$(echo "$api_test" | sed '$d')

    if echo "$api_test" | grep -q '"object":"list"'; then
      api_ready=true
      output "DEBUG: API is ready after $attempts attempts"
      break
    fi

    attempts=$((attempts + 1))
    if [ $((attempts % 5)) -eq 0 ]; then
      output "DEBUG: API check attempt $attempts, HTTP status: $http_code, response: $(echo "$api_test" | head -c 100)"
    fi
    sleep 2
  done

  if [ "$api_ready" == false ]; then
    warning "API did not become ready in time, skipping server creation"
    error "DEBUG: Final HTTP status: $http_code"
    error "DEBUG: Final response: $api_test"
    return 1
  fi

  # Create the server
  output "Sending server creation request..."
  output "DEBUG: POST ${panel_url}/api/application/servers"

  local server_response
  local server_http_code
  server_response=$(curl -s -L -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $api_key" \
    -H "Content-Type: application/json" \
    -H "Accept: Application/vnd.pterodactyl.v1+json" \
    -d "$server_json" \
    "${panel_url}/api/application/servers" 2>/dev/null)

  server_http_code=$(echo "$server_response" | tail -n1)
  server_response=$(echo "$server_response" | sed '$d')

  output "DEBUG: Server creation HTTP status: $server_http_code"
  output "DEBUG: Server creation response: $(echo "$server_response" | head -c 300)"

  if echo "$server_response" | grep -q '"object":"server"'; then
    local server_id
    server_id=$(echo "$server_response" | jq -r '.attributes.id' 2>/dev/null)
    local server_uuid
    server_uuid=$(echo "$server_response" | jq -r '.attributes.uuid' 2>/dev/null)
    success "Minecraft server created successfully (ID: $server_id)"
    echo "$server_id|$server_uuid"
    return 0
  else
    warning "Failed to create Minecraft server"
    error "HTTP status: $server_http_code"
    local error_detail
    error_detail=$(echo "$server_response" | jq -r '.errors[0].detail // .message // "Unknown error"' 2>/dev/null)
    error "API Error: $error_detail"
    error "Raw response: $server_response"
    return 1
  fi
}

# ------------------ API Key Generation ----------------- #

generate_api_key() {
  local install_dir="${1:-$INSTALL_DIR}"

  output "Generating Application API Key..." >&2

  cd "$install_dir" || return 1

  # Use a heredoc for cleaner PHP code without escaping hell
  # Capture only stdout (the key), stderr goes to terminal for debugging
  local api_key_result
  api_key_result=$(php artisan tinker --execute='
    use Pterodactyl\Models\ApiKey;
    use Pterodactyl\Models\User;
    use Pterodactyl\Services\Api\KeyCreationService;

    // Get the first ADMIN user (root_admin = 1)
    $user = User::where("root_admin", true)->first();
    if (!$user) {
        fwrite(STDERR, "No admin users found in database\n");
        exit(1);
    }

    fwrite(STDERR, "DEBUG: Using admin user ID: " . $user->id . " (root_admin: " . $user->root_admin . ")\n");

    // Delete existing key with same memo
    $deleted = ApiKey::query()
        ->where("user_id", $user->id)
        ->where("memo", "Installer API Key")
        ->delete();
    fwrite(STDERR, "DEBUG: Deleted existing keys: " . $deleted . "\n");

    $service = app(KeyCreationService::class);
    $apiKey = $service->setKeyType(ApiKey::TYPE_APPLICATION)->handle([
        "user_id" => $user->id,
        "memo" => "Installer API Key",
        "allowed_ips" => [],
    ], [
        "r_servers" => 3,
        "r_nodes" => 3,
        "r_allocations" => 3,
        "r_users" => 3,
        "r_locations" => 3,
        "r_nests" => 3,
        "r_eggs" => 3,
        "r_database_hosts" => 3,
        "r_server_databases" => 3,
    ]);

    fwrite(STDERR, "DEBUG: API Key created - Identifier: " . $apiKey->identifier . ", Key Type: " . $apiKey->key_type . "\n");

    // Output only the key for easy capture (no newlines, no extra output)
    echo $apiKey->identifier . decrypt($apiKey->token);
  ')

  local exit_code=$?

  output "DEBUG: PHP exit code: $exit_code" >&2
  output "DEBUG: Raw key result length: ${#api_key_result}" >&2

  if [ $exit_code -ne 0 ]; then
    warning "Failed to generate API key" >&2
    return 1
  fi

  # The API key should be the only thing in stdout (48 chars: pyro_ + identifier + token)
  local api_key="$api_key_result"

  output "DEBUG: Key length: ${#api_key}" >&2

  if [ -n "$api_key" ] && [ "${#api_key}" -eq 48 ]; then
    success "API Key generated successfully" >&2
    echo "$api_key"
    return 0
  else
    warning "Failed to generate API key (invalid format or length ${#api_key})" >&2
    return 1
  fi
}

# ------------------ API-Based Node Management ----------------- #

# Get server country code via IP geolocation
get_server_country_code() {
  local country_code=""

  # Try ipapi.co first (free, no auth required for basic requests)
  country_code=$(curl -s --max-time 10 "https://ipapi.co/country_code/" 2>/dev/null || echo "")

  # Check if response is an error (contains ERROR or RATELIMITED)
  if echo "$country_code" | grep -qi "error\|ratelimited"; then
    country_code=""
  fi

  # If that fails, try ipinfo.io
  if [ -z "$country_code" ] || [ "$country_code" == "null" ]; then
    country_code=$(curl -s --max-time 10 "https://ipinfo.io/country" 2>/dev/null || echo "")
  fi

  # Check if response is an error
  if echo "$country_code" | grep -qi "error\|ratelimited"; then
    country_code=""
  fi

  # If that fails, try ifconfig.co
  if [ -z "$country_code" ] || [ "$country_code" == "null" ]; then
    country_code=$(curl -s --max-time 10 "https://ifconfig.co/country-iso" 2>/dev/null || echo "")
  fi

  # Check if response is an error
  if echo "$country_code" | grep -qi "error\|ratelimited"; then
    country_code=""
  fi

  # Validate country code - should be exactly 2 characters (letters only)
  if [ -n "$country_code" ] && [ "$country_code" != "null" ]; then
    # Clean up whitespace and convert to uppercase
    country_code=$(echo "$country_code" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')
    # Validate it's exactly 2 letters
    if [[ "$country_code" =~ ^[A-Z]{2}$ ]]; then
      echo "$country_code"
      return 0
    fi
  fi

  # Default to XX if all failed or invalid
  echo "XX"
}

# Get or create location via API
get_or_create_location() {
  local api_key="$1"
  local panel_url="$2"
  local country_code="$3"

  # Output to stderr so it doesn't pollute the return value
  output "Checking for existing location with code: ${COLOR_ORANGE}${country_code}${COLOR_NC}" >&2

  # Get all locations
  output "DEBUG: Fetching locations from ${panel_url}/api/application/locations" >&2
  output "DEBUG: panel_url='${panel_url}'" >&2
  output "DEBUG: api_key='${api_key}'" >&2
  output "DEBUG: api_key length='${#api_key}'" >&2
  output "DEBUG: country_code='${country_code}'" >&2

  # Validate inputs before making request
  if [ -z "$api_key" ]; then
    error "API key is empty!" >&2
    return 1
  fi

  if [ -z "$panel_url" ]; then
    error "Panel URL is empty!" >&2
    return 1
  fi

  local locations_response
  local http_code
  output "DEBUG: Executing curl..." >&2

  locations_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer ${api_key}" \
    -H "Accept: Application/vnd.pterodactyl.v1+json" \
    -H "Content-Type: application/json" \
    "${panel_url}/api/application/locations" 2>&1)

  http_code=$(echo "$locations_response" | tail -n1)
  locations_response=$(echo "$locations_response" | sed '$d')

  output "DEBUG: HTTP status code: $http_code" >&2

  if [ "$http_code" != "200" ]; then
    error "Failed to fetch locations. HTTP status: $http_code" >&2
    error "Response: $locations_response" >&2
    return 1
  fi

  if [ -n "$locations_response" ] && echo "$locations_response" | grep -q '"object":"list"'; then
    # Check if location with this short code exists
    local existing_location
    existing_location=$(echo "$locations_response" | jq -r ".data[] | select(.attributes.short == \"${country_code}\") | .attributes.id" 2>/dev/null | head -1)

    if [ -n "$existing_location" ] && [ "$existing_location" != "null" ]; then
      info "Found existing location: ${country_code} (ID: ${existing_location})" >&2
      # Only output the ID to stdout
      echo "$existing_location"
      return 0
    fi
  fi

  # Location doesn't exist, create it
  output "Creating new location: ${COLOR_ORANGE}${country_code}${COLOR_NC}" >&2
  output "DEBUG: POST ${panel_url}/api/application/locations with data: {\"short\":\"${country_code}\",\"long\":\"${country_code} Region\"}" >&2

  local create_response
  local create_http_code
  create_response=$(curl -s -L -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $api_key" \
    -H "Accept: Application/vnd.pterodactyl.v1+json" \
    -H "Content-Type: application/json" \
    -d "{\"short\":\"${country_code}\",\"long\":\"${country_code} Region\"}" \
    "${panel_url}/api/application/locations" 2>/dev/null)

  create_http_code=$(echo "$create_response" | tail -n1)
  create_response=$(echo "$create_response" | sed '$d')

  output "DEBUG: Create location HTTP status: $create_http_code" >&2
  output "DEBUG: Create location response: $create_response" >&2

  if [ -n "$create_response" ] && echo "$create_response" | grep -q '"object":"location"'; then
    local new_location_id
    new_location_id=$(echo "$create_response" | jq -r '.attributes.id' 2>/dev/null)
    success "Created location: ${country_code} (ID: ${new_location_id})" >&2
    # Only output the ID to stdout
    echo "$new_location_id"
    return 0
  else
    error "Failed to create location" >&2
    error "HTTP status code: $create_http_code" >&2
    error "Response body: $create_response" >&2
    # Try to extract error details if present
    local error_detail
    error_detail=$(echo "$create_response" | jq -r '.errors[0].detail // .message // "No detailed error available"' 2>/dev/null)
    if [ -n "$error_detail" ] && [ "$error_detail" != "null" ]; then
      error "API Error: $error_detail" >&2
    fi
    return 1
  fi
}

# Create node via API
create_node_via_api() {
  local api_key="$1"
  local panel_url="$2"
  local location_id="$3"
  local node_name="$4"
  local memory_mb="$5"
  local disk_mb="$6"
  local behind_proxy="${7:-false}"
  local panel_fqdn="${8:-}"

  output "Creating node: ${COLOR_ORANGE}${node_name}${COLOR_NC}" >&2

  # Convert bash boolean to JSON boolean
  local json_behind_proxy="false"
  if [ "$behind_proxy" == "true" ] || [ "$behind_proxy" == "1" ]; then
    json_behind_proxy="true"
  fi

  # Detect system specs if not provided
  if [ -z "$memory_mb" ] || [ "$memory_mb" == "0" ]; then
    memory_mb=$(get_ram_mb)
    memory_mb=${memory_mb:-8192}
  fi

  if [ -z "$disk_mb" ] || [ "$disk_mb" == "0" ]; then
    # Get total disk space in GB and convert to MB
    local disk_gb
    disk_gb=$(df -BG / | awk 'NR==2 {gsub(/G/,""); print $2}')
    disk_mb=$((disk_gb * 1024))
    disk_mb=${disk_mb:-32768}
  fi

  # Validate location_id is numeric
  if ! [[ "$location_id" =~ ^[0-9]+$ ]]; then
    error "Invalid location_id: '${location_id}' (must be a number)"
    return 1
  fi

  # Sanitize node_name - remove characters that would break JSON
  node_name=$(echo "$node_name" | sed 's/["\\]//g')

  # Ensure node_name is not empty
  if [ -z "$node_name" ]; then
    node_name="Elytra-Node-$(hostname -s)"
  fi

  # Get server FQDN and sanitize it
  local fqdn
  if [ -n "$panel_fqdn" ]; then
    fqdn="$panel_fqdn"
  else
    fqdn="localhost"
  fi
  # Sanitize FQDN - remove quotes and backslashes that would break JSON
  fqdn=$(echo "$fqdn" | sed 's/["\\]//g')

  # Build JSON using temp file to avoid shell escaping issues
  local json_file
  json_file=$(mktemp)
  local current_date
  current_date=$(date +%Y-%m-%d)

  output "DEBUG: Creating node with name='${node_name}', location_id=${location_id}, memory=${memory_mb}, disk=${disk_mb}" >&2

  if cmd_exists jq; then
    # Use jq for proper JSON construction
    if ! jq -n \
      --arg name "$node_name" \
      --arg desc "Elytra node auto-created on $current_date" \
      --argjson location_id "$location_id" \
      --arg fqdn "$fqdn" \
      --argjson behind_proxy "$json_behind_proxy" \
      --argjson memory "$memory_mb" \
      --argjson disk "$disk_mb" \
      '{name: $name, description: $desc, location_id: $location_id, fqdn: $fqdn, scheme: "https", behind_proxy: $behind_proxy, public: true, memory: $memory, memory_overallocate: 0, disk: $disk, disk_overallocate: 0, upload_size: 100, daemon_listen: 8080, daemon_sftp: 2022, maintenance_mode: false, daemon_type: "elytra", backup_disk: "rustic_local"}' > "$json_file" 2>&1; then
      error "Failed to build JSON with jq"
      error "jq error: $(cat "$json_file")"
      rm -f "$json_file"
      return 1
    fi
  else
    # Fallback: write JSON directly to file
    printf '{"name":"%s","description":"Elytra node auto-created on %s","location_id":%s,"fqdn":"%s","scheme":"https","behind_proxy":%s,"public":true,"memory":%s,"memory_overallocate":0,"disk":%s,"disk_overallocate":0,"upload_size":100,"daemon_listen":8080,"daemon_sftp":2022,"maintenance_mode":false,"daemon_type":"elytra","backup_disk":"rustic_local"}' \
      "$node_name" "$current_date" "$location_id" "$fqdn" "$json_behind_proxy" "$memory_mb" "$disk_mb" > "$json_file"
  fi

  output "DEBUG: POST ${panel_url}/api/application/nodes" >&2
  output "DEBUG: Request JSON:" >&2
  cat "$json_file" >&2
  output "DEBUG: JSON file size: $(wc -c < "$json_file") bytes" >&2
  output "DEBUG: JSON content validation:" >&2
  if cmd_exists python3; then
    python3 -m json.tool "$json_file" > /dev/null 2>&1 && output "DEBUG: JSON is valid" >&2 || output "DEBUG: JSON is INVALID" >&2
  fi

  local create_response
  local create_http_code
  create_response=$(curl -s -L -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $api_key" \
    -H "Accept: Application/vnd.pterodactyl.v1+json" \
    -H "Content-Type: application/json" \
    -d @"$json_file" \
    "${panel_url}/api/application/nodes" 2>/dev/null)

  create_http_code=$(echo "$create_response" | tail -n1)
  create_response=$(echo "$create_response" | sed '$d')

  # Clean up temp file
  rm -f "$json_file"

  output "DEBUG: Create node HTTP status: $create_http_code" >&2
  output "DEBUG: Create node response preview: $(echo "$create_response" | head -c 300)" >&2

  if [ -n "$create_response" ] && echo "$create_response" | grep -q '"object":"node"'; then
    local node_id
    node_id=$(echo "$create_response" | jq -r '.attributes.id' 2>/dev/null)
    success "Created node: ${node_name} (ID: ${node_id})" >&2
    echo "$node_id"
    return 0
  else
    error "Failed to create node"
    local error_detail
    error_detail=$(echo "$create_response" | jq -r '.errors[0].detail // .message // "Unknown error"' 2>/dev/null || echo "Unknown error")
    error "API Error: ${error_detail}"
    # Debug output
    if [ -n "$create_response" ]; then
      warning "Raw response: $create_response"
    fi
    return 1
  fi
}

# Create allocations for node
create_node_allocations() {
  local api_key="$1"
  local panel_url="$2"
  local node_id="$3"
  local game_port_start="${4:-28015}"
  local game_port_end="${5:-28100}"

  output "Creating allocations for node..."

  # Get primary IP
  local primary_ip
  primary_ip=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "0.0.0.0")

  # Create port ranges (Minecraft, Source Engine, general range)
  local ports_json="[\"25565-25665\",\"27015-27150\",\"${game_port_start}-${game_port_end}\"]"

  # Capture both response and HTTP status code
  local create_response
  local http_code
  create_response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $api_key" \
    -H "Accept: Application/vnd.pterodactyl.v1+json" \
    -H "Content-Type: application/json" \
    -d "{
      \"ip\":\"${primary_ip}\",
      \"ports\":${ports_json}
    }" \
    "${panel_url}/api/application/nodes/${node_id}/allocations" 2>/dev/null || echo "")

  # Extract HTTP status code (last line)
  http_code=$(echo "$create_response" | tail -n1)
  # Remove status code from response body
  create_response=$(echo "$create_response" | sed '$d')

  # Check for success - HTTP 204 (No Content) or response with data
  if [ "$http_code" == "204" ]; then
    success "Created allocations (HTTP 204)"
    return 0
  elif [ -n "$create_response" ] && (echo "$create_response" | grep -q '"object":"list"' || echo "$create_response" | grep -q '"data":'); then
    local allocation_count
    allocation_count=$(echo "$create_response" | jq -r '.data | length' 2>/dev/null || echo "some")
    success "Created ${allocation_count} allocations"
    return 0
  else
    # Don't warn if allocations might have been created
    output "DEBUG: HTTP status: $http_code, response: $create_response" >&2
    warning "Could not confirm allocations creation (node may still work)"
    return 0
  fi
}

# Get node configuration token via API
get_node_configuration() {
  local api_key="$1"
  local panel_url="$2"
  local node_id="$3"

  output "Retrieving node configuration..." >&2

  local config_response
  config_response=$(curl -s \
    -H "Authorization: Bearer $api_key" \
    -H "Accept: Application/vnd.pterodactyl.v1+json" \
    "${panel_url}/api/application/nodes/${node_id}/configuration" 2>/dev/null || echo "")

  if [ -z "$config_response" ] || ! echo "$config_response" | grep -q '"token"'; then
    error "Failed to get node configuration"
    return 1
  fi

  # Extract token and UUID
  local node_token
  local node_uuid
  node_token=$(echo "$config_response" | jq -r '.token' 2>/dev/null || echo "")
  node_uuid=$(echo "$config_response" | jq -r '.uuid' 2>/dev/null || echo "")

  if [ -z "$node_token" ] || [ "$node_token" == "null" ]; then
    error "Failed to extract node token from configuration"
    return 1
  fi

  # Output token and UUID separated by pipe
  echo "${node_token}|${node_uuid}"
  return 0
}

# ------------------ Initial OS Detection ----------------- #

# Detect OS on load
detect_os

# ------------------ Installation Info Functions ----------------- #

# Directory for storing installation information
INSTALL_INFO_DIR="/etc/pyrodactyl/install-info"

# Save panel installation information
save_panel_install_info() {
  local install_type="${1:-install}"

  # Create directory if it doesn't exist
  mkdir -p "$INSTALL_INFO_DIR"
  chmod 700 "$INSTALL_INFO_DIR"

  local info_file="$INSTALL_INFO_DIR/panel-info"

  output "Saving panel installation information..."

  {
    echo "# Pyrodactyl Panel Installation Information"
    echo "# Generated: $(date)"
    echo "# Type: $install_type"
    echo ""
    echo "INSTALL_DATE=\"$(date)\""
    echo "INSTALL_TYPE=\"$install_type\""
    [ -n "$PANEL_VERSION" ] && echo "PANEL_VERSION=\"$PANEL_VERSION\""
    [ -n "$FQDN" ] && echo "FQDN=\"$FQDN\""
    [ -n "$MYSQL_DB" ] && echo "MYSQL_DB=\"$MYSQL_DB\""
    [ -n "$MYSQL_USER" ] && echo "MYSQL_USER=\"$MYSQL_USER\""
    [ -n "$MYSQL_PASSWORD" ] && echo "MYSQL_PASSWORD=\"$MYSQL_PASSWORD\""
    [ -n "$MYSQL_ROOT_PASSWORD" ] && echo "MYSQL_ROOT_PASSWORD=\"$MYSQL_ROOT_PASSWORD\""
    [ -n "$timezone" ] && echo "TIMEZONE=\"$timezone\""
    [ -n "$email" ] && echo "EMAIL=\"$email\""
    [ -n "$user_email" ] && echo "USER_EMAIL=\"$user_email\""
    [ -n "$user_username" ] && echo "USER_USERNAME=\"$user_username\""
    [ -n "$user_firstname" ] && echo "USER_FIRSTNAME=\"$user_firstname\""
    [ -n "$user_lastname" ] && echo "USER_LASTNAME=\"$user_lastname\""
    [ -n "$user_password" ] && echo "USER_PASSWORD=\"$user_password\""
    [ -n "$PANEL_REPO" ] && echo "PANEL_REPO=\"$PANEL_REPO\""
    [ -n "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN=\"$GITHUB_TOKEN\""
    echo "INSTALL_DIR=\"$INSTALL_DIR\""
    echo "WEBUSER=\"$WEBUSER\""
    echo "WEBGROUP=\"$WEBGROUP\""
    echo "PHP_VERSION=\"$PHP_VERSION\""
  } > "$info_file"

  chmod 600 "$info_file"
  success "Panel installation information saved to $info_file"
}

# Save Elytra installation information
save_elytra_install_info() {
  local install_type="${1:-install}"

  # Create directory if it doesn't exist
  mkdir -p "$INSTALL_INFO_DIR"
  chmod 700 "$INSTALL_INFO_DIR"

  local info_file="$INSTALL_INFO_DIR/elytra-info"

  output "Saving Elytra installation information..."

  {
    echo "# Elytra Daemon Installation Information"
    echo "# Generated: $(date)"
    echo "# Type: $install_type"
    echo ""
    echo "INSTALL_DATE=\"$(date)\""
    echo "INSTALL_TYPE=\"$install_type\""
    [ -n "$ELYTRA_VERSION" ] && echo "ELYTRA_VERSION=\"$ELYTRA_VERSION\""
    [ -n "$ELYTRA_REPO" ] && echo "ELYTRA_REPO=\"$ELYTRA_REPO\""
    [ -n "$GITHUB_TOKEN" ] && echo "GITHUB_TOKEN=\"$GITHUB_TOKEN\""
    [ -n "$PANEL_FQDN" ] && echo "PANEL_FQDN=\"$PANEL_FQDN\""
    [ -n "$PANEL_URL" ] && echo "PANEL_URL=\"$PANEL_URL\""
    [ -n "$NODE_NAME" ] && echo "NODE_NAME=\"$NODE_NAME\""
    [ -n "$NODE_MEMORY" ] && echo "NODE_MEMORY=\"$NODE_MEMORY\""
    [ -n "$NODE_DISK" ] && echo "NODE_DISK=\"$NODE_DISK\""
    [ -n "$ALLOCATION_PORT_START" ] && echo "ALLOCATION_PORT_START=\"$ALLOCATION_PORT_START\""
    [ -n "$ALLOCATION_PORT_END" ] && echo "ALLOCATION_PORT_END=\"$ALLOCATION_PORT_END\""
    [ -n "$API_KEY" ] && echo "API_KEY=\"$API_KEY\""
    [ -n "$LOCATION_ID" ] && echo "LOCATION_ID=\"$LOCATION_ID\""
    [ -n "$NODE_ID" ] && echo "NODE_ID=\"$NODE_ID\""
    [ -n "$NODE_TOKEN" ] && echo "NODE_TOKEN=\"$NODE_TOKEN\""
    [ -n "$NODE_UUID" ] && echo "NODE_UUID=\"$NODE_UUID\""
    [ -n "$FQDN" ] && echo "FQDN=\"$FQDN\""
    [ -n "$CONFIGURE_LETSENCRYPT" ] && echo "CONFIGURE_LETSENCRYPT=\"$CONFIGURE_LETSENCRYPT\""
    [ -n "$SSL_CERT_PATH" ] && echo "SSL_CERT_PATH=\"$SSL_CERT_PATH\""
    [ -n "$SSL_KEY_PATH" ] && echo "SSL_KEY_PATH=\"$SSL_KEY_PATH\""
    [ -n "$ASSUME_SSL" ] && echo "ASSUME_SSL=\"$ASSUME_SSL\""
    echo "ELYTRA_DIR=\"$ELYTRA_DIR\""
    echo "ELYTRA_BINARY=\"$ELYTRA_BINARY\""
  } > "$info_file"

  chmod 600 "$info_file"
  success "Elytra installation information saved to $info_file"
}

# Load panel installation information
load_panel_install_info() {
  local info_file="$INSTALL_INFO_DIR/panel-info"

  if [ -f "$info_file" ]; then
    # shellcheck source=/dev/null
    source "$info_file"
    return 0
  fi
  return 1
}

# Load Elytra installation information
load_elytra_install_info() {
  local info_file="$INSTALL_INFO_DIR/elytra-info"

  if [ -f "$info_file" ]; then
    # shellcheck source=/dev/null
    source "$info_file"
    return 0
  fi
  return 1
}

# Check if panel installation info exists
panel_install_info_exists() {
  [ -f "$INSTALL_INFO_DIR/panel-info" ]
}

# Check if Elytra installation info exists
elytra_install_info_exists() {
  [ -f "$INSTALL_INFO_DIR/elytra-info" ]
}

# Display panel installation information
display_panel_install_info() {
  if ! panel_install_info_exists; then
    warning "No panel installation information found"
    return 1
  fi

  # Load the info
  load_panel_install_info

  print_brake 70
  echo ""
  echo -e "  ${COLOR_ORANGE}Pyrodactyl Panel Installation Information${COLOR_NC}"
  echo ""
  print_brake 70
  echo ""
  [ -n "$INSTALL_DATE" ] && output "Installation Date: $INSTALL_DATE"
  [ -n "$INSTALL_TYPE" ] && output "Type: $INSTALL_TYPE"
  [ -n "$PANEL_VERSION" ] && output "Version: $PANEL_VERSION"
  [ -n "$FQDN" ] && output "FQDN: $FQDN"
  [ -n "$MYSQL_DB" ] && output "Database Name: $MYSQL_DB"
  [ -n "$MYSQL_USER" ] && output "Database User: $MYSQL_USER"
  [ -n "$MYSQL_PASSWORD" ] && output "Database Password: (hidden)"
  [ -n "$timezone" ] && output "Timezone: $timezone"
  [ -n "$email" ] && output "Admin Email: $email"
  [ -n "$user_email" ] && output "Initial User Email: $user_email"
  [ -n "$user_username" ] && output "Initial User Username: $user_username"
  [ -n "$user_firstname" ] && output "Initial User First Name: $user_firstname"
  [ -n "$user_lastname" ] && output "Initial User Last Name: $user_lastname"
  [ -n "$user_password" ] && output "Initial User Password: (hidden)"
  [ -n "$PANEL_REPO" ] && output "Repository: $PANEL_REPO"
  [ -n "$INSTALL_DIR" ] && output "Install Directory: $INSTALL_DIR"
  [ -n "$PHP_VERSION" ] && output "PHP Version: $PHP_VERSION"
  echo ""
  print_brake 70
  echo ""
  output "Information file: $INSTALL_INFO_DIR/panel-info"
  echo ""
}

# Display Elytra installation information
display_elytra_install_info() {
  if ! elytra_install_info_exists; then
    warning "No Elytra installation information found"
    return 1
  fi

  # Load the info
  load_elytra_install_info

  print_brake 70
  echo ""
  echo -e "  ${COLOR_ORANGE}Elytra Daemon Installation Information${COLOR_NC}"
  echo ""
  print_brake 70
  echo ""
  [ -n "$INSTALL_DATE" ] && output "Installation Date: $INSTALL_DATE"
  [ -n "$INSTALL_TYPE" ] && output "Type: $INSTALL_TYPE"
  [ -n "$ELYTRA_VERSION" ] && output "Version: $ELYTRA_VERSION"
  [ -n "$PANEL_FQDN" ] && output "Panel FQDN: $PANEL_FQDN"
  [ -n "$PANEL_URL" ] && output "Panel URL: $PANEL_URL"
  [ -n "$NODE_NAME" ] && output "Node Name: $NODE_NAME"
  [ -n "$NODE_MEMORY" ] && output "Node Memory: $NODE_MEMORY MB"
  [ -n "$NODE_DISK" ] && output "Node Disk: $NODE_DISK MB"
  [ -n "$ALLOCATION_PORT_START" ] && output "Allocation Port Start: $ALLOCATION_PORT_START"
  [ -n "$ALLOCATION_PORT_END" ] && output "Allocation Port End: $ALLOCATION_PORT_END"
  [ -n "$LOCATION_ID" ] && output "Location ID: $LOCATION_ID"
  [ -n "$NODE_ID" ] && output "Node ID: $NODE_ID"
  [ -n "$NODE_TOKEN" ] && output "Node Token: (hidden)"
  [ -n "$NODE_UUID" ] && output "Node UUID: $NODE_UUID"
  [ -n "$ELYTRA_DIR" ] && output "Config Directory: $ELYTRA_DIR"
  [ -n "$ELYTRA_BINARY" ] && output "Binary Location: $ELYTRA_BINARY"
  [ -n "$ELYTRA_REPO" ] && output "Repository: $ELYTRA_REPO"
  echo ""
  print_brake 70
  echo ""
  output "Information file: $INSTALL_INFO_DIR/elytra-info"
  echo ""
}

# Display completion screen for panel
show_panel_completion() {
  local install_type="${1:-Installation}"

  print_brake 70
  echo ""
  echo -e "  ${COLOR_GREEN}✓ $install_type Completed Successfully!${COLOR_NC}"
  echo ""
  print_brake 70
  echo ""
  output "Your Pyrodactyl panel has been installed and configured."
  echo ""
  [ -n "$FQDN" ] && output "Panel URL: https://$FQDN"
  [ -n "$user_email" ] && output "Admin Email: $user_email"
  [ -n "$user_username" ] && output "Admin Username: $user_username"
  [ -n "$user_password" ] && output "Admin Password: (saved in install info)"
  echo ""
  output "Installation Details:"
  [ -n "$MYSQL_DB" ] && output "  Database: $MYSQL_DB"
  [ -n "$MYSQL_USER" ] && output "  DB User: $MYSQL_USER"
  output "  Install Directory: $INSTALL_DIR"
  echo ""
  output "To view installation information later, run:"
  output "  bash <(curl -sSL $GITHUB_BASE_URL/$GITHUB_SOURCE/install.sh)"
  output "  and select 'View Installation Information'"
  echo ""
  print_brake 70
  echo ""
}

# Display completion screen for Elytra
show_elytra_completion() {
  local install_type="${1:-Installation}"

  print_brake 70
  echo ""
  echo -e "  ${COLOR_GREEN}✓ $install_type Completed Successfully!${COLOR_NC}"
  echo ""
  print_brake 70
  echo ""
  output "Your Elytra daemon has been installed and configured."
  echo ""
  [ -n "$PANEL_URL" ] && output "Panel URL: $PANEL_URL"
  [ -n "$NODE_NAME" ] && output "Node Name: $NODE_NAME"
  [ -n "$NODE_TOKEN" ] && output "Node Token: (saved in install info)"
  echo ""
  output "Next Steps:"
  output "  1. Start Elytra: systemctl start elytra"
  output "  2. Check status: systemctl status elytra"
  output "  3. View logs: journalctl -u elytra -f"
  echo ""
  output "To view installation information later, run:"
  output "  bash <(curl -sSL $GITHUB_BASE_URL/$GITHUB_SOURCE/install.sh)"
  output "  and select 'View Installation Information'"
  echo ""
  print_brake 70
  echo ""
}

# Display completion screen for both
show_both_completion() {
  print_brake 70
  echo ""
  echo -e "  ${COLOR_GREEN}✓ Full Installation Completed Successfully!${COLOR_NC}"
  echo ""
  print_brake 70
  echo ""
  output "Both Pyrodactyl Panel and Elytra Daemon have been installed."
  echo ""
  [ -n "$FQDN" ] && output "Panel URL: https://$FQDN"
  [ -n "$user_email" ] && output "Admin Email: $user_email"
  [ -n "$user_username" ] && output "Admin Username: $user_username"
  [ -n "$NODE_NAME" ] && output "Node Name: $NODE_NAME"
  echo ""
  output "Next Steps:"
  output "  1. Start Elytra: systemctl start elytra"
  output "  2. Check Elytra status: systemctl status elytra"
  output "  3. Access your panel at: https://$FQDN"
  output "  4. Log in with your admin credentials"
  echo ""
  output "To view installation information later, run:"
  output "  bash <(curl -sSL $GITHUB_BASE_URL/$GITHUB_SOURCE/install.sh)"
  output "  and select 'View Installation Information'"
  echo ""
  print_brake 70
  echo ""
}

# ------------------ Health Check Functions ----------------- #

# Check panel health
check_panel_health() {
  local panel_dir="${1:-$INSTALL_DIR}"
  local has_errors=false

  echo ""
  output "${COLOR_ORANGE}Panel Health Check${COLOR_NC}"
  echo ""

  # Check directory exists
  if [ ! -d "$panel_dir" ]; then
    error "Panel directory not found: $panel_dir"
    return 1
  fi
  output "✓ Panel directory exists"

  # Check artisan exists
  if [ ! -f "$panel_dir/artisan" ]; then
    error "artisan command not found"
    has_errors=true
  else
    output "✓ artisan command exists"
  fi

  # Check .env exists
  if [ ! -f "$panel_dir/.env" ]; then
    warning ".env file not found"
    has_errors=true
  else
    output "✓ .env file exists"
  fi

  # Check storage permissions
  if [ -d "$panel_dir/storage" ]; then
    local storage_owner
    storage_owner=$(stat -c '%U' "$panel_dir/storage" 2>/dev/null)
    if [ "$storage_owner" == "www-data" ] || [ "$storage_owner" == "nginx" ]; then
      output "✓ Storage directory owned by $storage_owner"
    else
      warning "Storage directory owned by $storage_owner (expected www-data or nginx)"
      has_errors=true
    fi
  else
    warning "Storage directory not found"
    has_errors=true
  fi

  # Check bootstrap/cache permissions
  if [ -d "$panel_dir/bootstrap/cache" ]; then
    local cache_owner
    cache_owner=$(stat -c '%U' "$panel_dir/bootstrap/cache" 2>/dev/null)
    if [ "$cache_owner" == "www-data" ] || [ "$cache_owner" == "nginx" ]; then
      output "✓ Cache directory owned by $cache_owner"
    else
      warning "Cache directory owned by $cache_owner (expected www-data or nginx)"
      has_errors=true
    fi
  else
    warning "Cache directory not found"
    has_errors=true
  fi

  # Check services
  if systemctl is-active --quiet nginx 2>/dev/null; then
    output "✓ nginx is running"
  else
    warning "nginx is not running"
    has_errors=true
  fi

  # Check PHP-FPM (try multiple versions)
  local php_fpm_running=false
  for version in 8.4 8.3 8.2 8.1 8.0; do
    if systemctl is-active --quiet "php${version}-fpm" 2>/dev/null; then
      output "✓ php${version}-fpm is running"
      php_fpm_running=true
      break
    fi
  done
  if [ "$php_fpm_running" == false ]; then
    if systemctl is-active --quiet php-fpm 2>/dev/null; then
      output "✓ php-fpm is running"
      php_fpm_running=true
    else
      warning "PHP-FPM is not running"
      has_errors=true
    fi
  fi

  # Check Redis
  if systemctl is-active --quiet redis-server 2>/dev/null || systemctl is-active --quiet redis 2>/dev/null; then
    output "✓ Redis is running"
  else
    warning "Redis is not running"
    has_errors=true
  fi

  # Check database
  if systemctl is-active --quiet mariadb 2>/dev/null || systemctl is-active --quiet mysql 2>/dev/null; then
    output "✓ Database is running"
  else
    warning "Database is not running"
    has_errors=true
  fi

  # Check queue worker with detailed verification
  if ! verify_pyroq "$panel_dir"; then
    has_errors=true
  fi

  # Try to check if panel is responding (optional)
  if [ -f "$panel_dir/.env" ]; then
    local app_url
    app_url=$(grep "^APP_URL=" "$panel_dir/.env" 2>/dev/null | cut -d'=' -f2- | tr -d '"')
    if [ -n "$app_url" ] && command -v curl >/dev/null 2>&1; then
      if curl -sfL --max-time 5 "$app_url" >/dev/null 2>&1; then
        output "✓ Panel is responding at $app_url"
      else
        warning "Panel is not responding at $app_url"
      fi
    fi
  fi

  echo ""
  if [ "$has_errors" == true ]; then
    warning "Health check completed with warnings/errors"
  else
    success "Panel health check passed!"
  fi

  return 0
}

# Check Elytra health
check_elytra_health() {
  local has_errors=false

  echo ""
  output "${COLOR_ORANGE}Elytra Health Check${COLOR_NC}"
  echo ""

  # Check binary exists
  if [ -f "/usr/local/bin/elytra" ]; then
    output "✓ Elytra binary exists at /usr/local/bin/elytra"

    # Check binary is executable
    if [ -x "/usr/local/bin/elytra" ]; then
      output "✓ Elytra binary is executable"
    else
      warning "Elytra binary is not executable"
      has_errors=true
    fi

    # Check binary version
    local version
    version=$(/usr/local/bin/elytra --version 2>/dev/null | head -1)
    if [ -n "$version" ]; then
      output "✓ Elytra version: $version"
    fi
  else
    error "Elytra binary not found at /usr/local/bin/elytra"
    has_errors=true
  fi

  # Check config directory
  if [ -d "/etc/elytra" ]; then
    output "✓ Elytra config directory exists"

    if [ -f "/etc/elytra/config.yml" ]; then
      output "✓ Elytra config file exists"
    else
      warning "Elytra config file not found"
      has_errors=true
    fi
  else
    warning "Elytra config directory not found"
    has_errors=true
  fi

  # Check data directories
  for dir in /var/lib/elytra/volumes /var/lib/elytra/archives /var/lib/elytra/backups; do
    if [ -d "$dir" ]; then
      output "✓ Data directory exists: $dir"
    else
      warning "Data directory missing: $dir"
    fi
  done

  # Check Docker
  if systemctl is-active --quiet docker 2>/dev/null; then
    output "✓ Docker is running"
  else
    warning "Docker is not running"
    has_errors=true
  fi

  # Check service
  if systemctl is-active --quiet elytra 2>/dev/null; then
    output "✓ Elytra service is running"
  elif systemctl is-enabled --quiet elytra 2>/dev/null; then
    warning "Elytra service is enabled but not running"
  else
    warning "Elytra service is not enabled"
  fi

  echo ""
  if [ "$has_errors" == true ]; then
    warning "Health check completed with warnings/errors"
  else
    success "Elytra health check passed!"
  fi

  return 0
}

# Check both panel and Elytra health
check_both_health() {
  check_panel_health "$INSTALL_DIR"
  check_elytra_health
}

# Auto-fix Elytra permission issues
auto_fix_elytra_issues() {
  info "Attempting to auto-fix Elytra issues..."

  # Fix binary permissions
  if [ -f "/usr/local/bin/elytra" ]; then
    info "Fixing binary permissions..."
    chmod +x /usr/local/bin/elytra
  fi

  # Fix data directory permissions
  info "Fixing data directory permissions..."
  mkdir -p /var/lib/elytra/volumes /var/lib/elytra/archives /var/lib/elytra/backups

  chown -R 8888:8888 /var/lib/elytra/volumes 2>/dev/null || true
  chown -R 8888:8888 /var/lib/elytra/archives 2>/dev/null || true
  chown -R 8888:8888 /var/lib/elytra/backups 2>/dev/null || true
  chown -R 8888:8888 /etc/elytra 2>/dev/null || true

  # Fix permissions
  info "Fixing Elytra permissions..."

  # Create directories if they don't exist
  mkdir -p /var/lib/elytra/volumes /var/lib/elytra/archives /var/lib/elytra/backups

  # Set permissions for containerized game servers
  # Note: 777 is required because game server containers run as arbitrary UIDs
  # and must be able to read/write/execute in these directories
  info "Setting 777 permissions on data directories for container access..."
  # Ensure parent /var/lib/elytra is accessible
  chmod 755 /var/lib/elytra 2>/dev/null || true
  # Ensure the volumes directory itself and all contents have 777
  chmod 777 /var/lib/elytra/volumes 2>/dev/null || true
  chmod -R 777 /var/lib/elytra/volumes/* 2>/dev/null || true
  chmod 777 /var/lib/elytra/archives 2>/dev/null || true
  chmod -R 777 /var/lib/elytra/archives/* 2>/dev/null || true
  chmod 777 /var/lib/elytra/backups 2>/dev/null || true
  chmod -R 777 /var/lib/elytra/backups/* 2>/dev/null || true

  # Set ACL default permissions so new directories inherit 777
  if command -v setfacl >/dev/null 2>&1; then
    info "Setting default ACL permissions for new files..."
    setfacl -R -m d:o:rx /var/lib/elytra/volumes 2>/dev/null || true
    setfacl -R -m d:g:rx /var/lib/elytra/volumes 2>/dev/null || true
  fi

  # Disable check_permissions_on_boot in Elytra config to prevent permission resets
  if [ -f "/etc/elytra/config.yml" ]; then
    info "Disabling permission checks in Elytra config..."
    sed -i 's/check_permissions_on_boot: true/check_permissions_on_boot: false/' /etc/elytra/config.yml 2>/dev/null || true
  fi

  # Elytra config directory - create if needed and set more restrictive permissions
  mkdir -p /etc/elytra
  find /etc/elytra -type d -exec chmod 755 {} \; 2>/dev/null || true
  # SECURITY: Config contains daemon credentials - restrict to owner-only
  find /etc/elytra -type f -name "config.yml" -exec chmod 600 {} \; 2>/dev/null || true
  find /etc/elytra -type f ! -name "config.yml" -exec chmod 640 {} \; 2>/dev/null || true

  # Restart Elytra service
  info "Restarting Elytra service..."
  systemctl restart elytra 2>/dev/null || true

  # Verify Elytra started
  sleep 3
  if systemctl is-active --quiet elytra 2>/dev/null; then
    success "Elytra is now running"
  else
    warning "Elytra may still have issues - manual intervention may be required"
  fi

  success "Auto-fix completed"
}
