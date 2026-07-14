#!/bin/bash

set -e

######################################################################################
#                                                                                    #
# Pyrodactyl Installer - FQDN Verification                                           #
#                                                                                    #
# This script verifies that a FQDN is valid and resolves to this server              #
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
    source <(curl -fsSL "${GITHUB_BASE_URL:-"https://raw.githubusercontent.com/Muspelheim-Hosting/pyrodactyl-installer"}/${GITHUB_SOURCE:-"main"}/lib/lib.sh") || true
  fi
  ! fn_exists lib_loaded && echo "* ERROR: Could not load lib script" && exit 1
fi

FQDN="$1"

# Color definitions
COLOR_YELLOW='\033[1;33m'
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_NC='\033[0m'

output() {
  echo -e "* $1"
}

success() {
  echo -e "${COLOR_GREEN}SUCCESS${COLOR_NC}: $1"
}

error() {
  echo -e "${COLOR_RED}ERROR${COLOR_NC}: $1" 1>&2
}

warning() {
  echo -e "${COLOR_YELLOW}WARNING${COLOR_NC}: $1"
}

# Check if FQDN is provided
if [ -z "$FQDN" ]; then
  error "No FQDN provided"
  exit 1
fi

output "Validating FQDN: $FQDN"

# Basic format validation - must contain at least one dot
if [[ ! "$FQDN" =~ \. ]]; then
  error "Invalid FQDN format: $FQDN"
  error "A valid FQDN must contain at least one dot (e.g., panel.example.com)"
  exit 1
fi

# Check for invalid characters
if [[ ! "$FQDN" =~ ^[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9]$ ]]; then
  error "Invalid characters in FQDN: $FQDN"
  error "FQDN must contain only letters, numbers, hyphens, and dots"
  exit 1
fi

# Check for consecutive dots
if [[ "$FQDN" =~ \.\. ]]; then
  error "Invalid FQDN: consecutive dots are not allowed"
  exit 1
fi

# Check for starting/ending with hyphen or dot
if [[ "$FQDN" =~ ^[.-]|[.-]$ ]]; then
  error "Invalid FQDN: cannot start or end with hyphen or dot"
  exit 1
fi

output "FQDN format is valid"

# Get server IP addresses
output "Detecting server IP addresses..."

IPV4=""
IPV6=""

# Try to get public IPv4
IPV4=$(curl -s -4 https://icanhazip.com 2>/dev/null || curl -s -4 https://ifconfig.me 2>/dev/null || echo "")

# Try to get public IPv6
IPV6=$(curl -s -6 https://icanhazip.com 2>/dev/null || curl -s -6 https://ifconfig.me 2>/dev/null || echo "")

# Get local IPs as fallback
LOCAL_IPV4=$(ip -4 route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || echo "")
LOCAL_IPV6=$(ip -6 route get 2001:4860:4860::8888 2>/dev/null | grep -oP 'src \K\S+' || echo "")

[ -n "$IPV4" ] && output "Public IPv4: $IPV4"
[ -n "$IPV6" ] && output "Public IPv6: $IPV6"
[ -z "$IPV4" ] && [ -n "$LOCAL_IPV4" ] && output "Local IPv4: $LOCAL_IPV4"
[ -z "$IPV6" ] && [ -n "$LOCAL_IPV6" ] && output "Local IPv6: $LOCAL_IPV6"

# Resolve FQDN
output "Resolving FQDN: $FQDN"

RESOLVED_IPS=$(dig +short "$FQDN" 2>/dev/null || nslookup "$FQDN" 2>/dev/null | grep -oP 'Address: \K\S+' || echo "")

if [ -z "$RESOLVED_IPS" ]; then
  error "Could not resolve FQDN: $FQDN"
  error "Please ensure the DNS record exists and has propagated"
  exit 1
fi

output "Resolved IPs for $FQDN:"
echo "$RESOLVED_IPS" | while read -r ip; do
  output "  - $ip"
done

# Check if any resolved IP matches server IPs
MATCH_FOUND=false

for resolved_ip in $RESOLVED_IPS; do
  if [ "$resolved_ip" == "$IPV4" ] || [ "$resolved_ip" == "$IPV6" ] || \
     [ "$resolved_ip" == "$LOCAL_IPV4" ] || [ "$resolved_ip" == "$LOCAL_IPV6" ]; then
    MATCH_FOUND=true
    break
  fi
done

if [ "$MATCH_FOUND" == "true" ]; then
  success "FQDN $FQDN resolves to this server"
  exit 0
else
  warning "FQDN $FQDN does not resolve to this server's IP addresses"
  echo ""
  output "This is required for Let's Encrypt SSL certificates to work."
  output "Please ensure your DNS A/AAAA record points to one of the following IPs:"
  [ -n "$IPV4" ] && output "  - $IPV4 (IPv4)"
  [ -n "$IPV6" ] && output "  - $IPV6 (IPv6)"
  [ -z "$IPV4" ] && [ -n "$LOCAL_IPV4" ] && output "  - $LOCAL_IPV4 (Local IPv4)"
  [ -z "$IPV6" ] && [ -n "$LOCAL_IPV6" ] && output "  - $LOCAL_IPV6 (Local IPv6)"
  echo ""
  output "If you've just created the DNS record, it may take a few minutes to propagate."

  # Ask if user wants to continue anyway
  echo ""
  local continue_anyway=""
  while [[ "$continue_anyway" != "y" && "$continue_anyway" != "n" ]]; do
    echo -n "* Continue anyway? [y/N]: "
    read -r continue_anyway
    continue_anyway=$(echo "$continue_anyway" | tr '[:upper:]' '[:lower:]')
    [ -z "$continue_anyway" ] && continue_anyway="n"

    if [[ "$continue_anyway" != "y" && "$continue_anyway" != "n" ]]; then
      echo "* Invalid input. Please enter 'y' or 'n'."
    fi
  done

  if [[ "$continue_anyway" == "y" ]]; then
    warning "Continuing without verified DNS resolution"
    warning "SSL certificate setup may fail"
    exit 0
  else
    exit 1
  fi
fi
