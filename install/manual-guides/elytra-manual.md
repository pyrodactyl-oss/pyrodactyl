# Elytra Daemon - Manual Installation Guide

This guide provides step-by-step instructions for manually installing the Elytra Daemon on your game server nodes. Elytra is the game server management daemon that communicates with the Pyrodactyl Panel and manages Docker containers for game servers.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites](#prerequisites)
3. [Step 1: System Updates](#step-1-system-updates)
4. [Step 2: Install Docker](#step-2-install-docker)
5. [Step 3: Configure Docker](#step-3-configure-docker)
6. [Step 4: Download and Install Elytra](#step-4-download-and-install-elytra)
7. [Step 5: Configure Elytra](#step-5-configure-elytra)
8. [Step 6: Configure SSL/TLS](#step-6-configure-ssltls)
9. [Step 7: Firewall Configuration](#step-7-firewall-configuration)
10. [Step 8: Connect to Pyrodactyl Panel](#step-8-connect-to-pyrodactyl-panel)
11. [Verification](#verification)
12. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
| Component | Specification |
|-----------|--------------|
| **CPU** | 2 cores (x86_64 or ARM64) |
| **RAM** | 2 GB |
| **Storage** | 20 GB SSD |
| **Network** | Public IPv4 or IPv6 |
| **OS** | Ubuntu 22.04/24.04, Debian 11/12, Rocky Linux 8/9, AlmaLinux 8/9 |
| **Virtualization** | KVM, VMware, Xen, or bare metal (OpenVZ/LXC **not supported**) |

### Recommended Requirements
| Component | Specification |
|-----------|--------------|
| **CPU** | 4+ cores |
| **RAM** | 4+ GB |
| **Storage** | 50+ GB SSD |
| **Network** | Both IPv4 and IPv6 |

### Important: Docker Compatibility
Elytra requires Docker to run game servers in isolated containers. Before proceeding, verify your virtualization supports Docker:

```bash
systemd-detect-virt
```

**Supported:** `none`, `kvm`, `vmware`, `xen`, `microsoft`  
**Not Supported:** `openvz`, `lxc`, `lxc-libvirt`

Check for Docker compatibility:
```bash
docker info 2>/dev/null | grep -i "WARNING: No swap limit support"
```

If you see this warning, you may need to enable swap accounting (see Step 3).

---

## Prerequisites

Before beginning, ensure you have:
- Root access to the server
- Pyrodactyl Panel already installed and accessible
- A registered domain or subdomain pointed to this server (for SSL)
- The server should be able to communicate with the Panel over HTTPS

---

## Step 1: System Updates

Update your system packages:

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# Rocky Linux/AlmaLinux/RHEL
dnf update -y

# Optional: Install useful tools
apt install -y curl wget nano htop tar gzip # Ubuntu/Debian
dnf install -y curl wget nano htop tar gzip # Rocky/AlmaLinux
```

---

## Step 2: Install Docker

### Ubuntu/Debian

**Option 1: Using the official Docker repository (Recommended)**

```bash
# Remove any old versions
apt remove docker docker-engine docker.io containerd runc 2>/dev/null || true

# Install prerequisites
apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

**Option 2: Using the convenience script (Quick install)**

```bash
curl -fsSL https://get.docker.com | sh
```

### Rocky Linux/AlmaLinux/RHEL

```bash
# Remove old versions
dnf remove docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-selinux docker-engine-selinux docker-engine 2>/dev/null || true

# Install dnf-plugins
dnf install -y dnf-plugins-core

# Add Docker repository
dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
# OR for CentOS/RHEL 8/9:
# dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

### Start and Enable Docker

```bash
systemctl enable --now docker

# Verify installation
docker --version
docker run hello-world
```

---

## Step 3: Configure Docker

### Enable Swap Support (Required for Game Servers)

By default, Docker doesn't support swap limits on many systems. Enable it:

**Ubuntu/Debian:**
```bash
# Check if swap accounting is enabled
docker info 2>/dev/null | grep -i swap

# If swap is not supported, enable it
sed -i 's/GRUB_CMDLINE_LINUX_DEFAULT="/GRUB_CMDLINE_LINUX_DEFAULT="swapaccount=1 /' /etc/default/grub
update-grub

# Alternative for systems that don't use GRUB_CMDLINE_LINUX_DEFAULT
if ! grep -q "GRUB_CMDLINE_LINUX_DEFAULT" /etc/default/grub; then
    sed -i 's/GRUB_CMDLINE_LINUX="/GRUB_CMDLINE_LINUX="swapaccount=1 /' /etc/default/grub
    update-grub
fi

# Reboot required
reboot
```

**Rocky/AlmaLinux/RHEL:**
```bash
# Edit GRUB configuration
grubby --update-kernel=ALL --args="systemd.unified_cgroup_hierarchy=1"

# Reboot required
reboot
```

### Configure Docker Network

Elytra uses a specific Docker network. You can customize this in the config later, but the defaults are usually fine.

```bash
# Verify Docker network (will be created automatically by Elytra)
docker network ls
```

### Create Data Directories

```bash
mkdir -p /var/lib/pyrodactyl/volumes
mkdir -p /var/lib/pyrodactyl/archives
mkdir -p /var/lib/pyrodactyl/backups
mkdir -p /etc/elytra
```

---

## Step 4: Download and Install Elytra

### Download Latest Release

```bash
# Detect architecture
ARCH=$(uname -m)
if [ "$ARCH" == "x86_64" ]; then
    ARCH="amd64"
elif [ "$ARCH" == "aarch64" ]; then
    ARCH="arm64"
else
    echo "Unsupported architecture: $ARCH"
    exit 1
fi

# Get latest release URL
LATEST_URL=$(curl -s https://api.github.com/repos/pyrohost/elytra/releases/latest | grep "browser_download_url" | grep "linux_${ARCH}" | cut -d'"' -f4)

# Download Elytra
curl -Lo /usr/local/bin/elytra "$LATEST_URL"

# Make executable
chmod +x /usr/local/bin/elytra

# Verify installation
elytra --version
```

### Create System User

Elytra runs as a dedicated user (UID 8888):

```bash
# Create group and user
groupadd --system --gid 8888 pyrodactyl 2>/dev/null || true
useradd --system --no-create-home --shell /usr/sbin/nologin --uid 8888 --gid 8888 pyrodactyl 2>/dev/null || true

# Set proper ownership
chown -R 8888:8888 /var/lib/pyrodactyl
chown -R 8888:8888 /etc/elytra

# Set permissions
# SECURITY NOTE: 777 permissions are required because containerized game servers
# run as various UIDs and must read/write game data, logs, and backups.
# This grants all users read/write/execute access to these directories.
# Ensure these directories are only accessible to trusted users.
chmod -R 777 /var/lib/pyrodactyl/volumes
chmod -R 777 /var/lib/pyrodactyl/archives
chmod -R 777 /var/lib/pyrodactyl/backups
```

---

## Step 5: Configure Elytra

### Create Configuration Directory and File

```bash
mkdir -p /etc/elytra
nano /etc/elytra/config.yml
```

### Basic Configuration Template

Create the configuration file. **Note:** You'll need to get the `uuid`, `token-id`, and `token` from the Pyrodactyl Panel after creating a node.

```yaml
debug: false
uuid: <UUID>
token-id: <TOKEN_ID>
token: <TOKEN>

api:
    host: 0.0.0.0
    port: 8080
    ssl:
        enabled: false
        certificate: /etc/elytra/certificate.pem
        key: /etc/elytra/certificate.key
    upload-limit: 100
    trusted-proxies: []

system:
    data: /var/lib/pyrodactyl/volumes
    archive: /var/lib/pyrodactyl/archives
    backup: /var/lib/pyrodactyl/backups
    tmpfs_size: 100
    websocket_log_count: 150

allowed-mounts: []
allowed-origins: []

remote: https://your-panel-domain.com
remote_query:
    timeout: 10
    interval: 60
    always: false

docker:
    network:
        interface: 172.18.0.1
        gateway: 172.18.0.1
        subnet: 172.18.0.0/16
        mtu: 1500
    domainname: ""
    registries: {}
    tmpfs:
        size: 100
        mode: 1777
    container:
        pid_limit: 2048
    installer_limits:
        memory: 2048
        cpu: 200

throttles:
    enabled: true
    lines: 1000
    line_reset_interval: 100
    maximum_trigger_count: 5
    decay_interval: 10000
    stop_grace_period: 15
    write_limit: 0
    download_limit: 0

installed: true
```

**Important:** Replace the following:
- `<UUID>` - Get from Panel after creating node
- `<TOKEN_ID>` - Get from Panel after creating node
- `<TOKEN>` - Get from Panel after creating node
- `https://your-panel-domain.com` - Your Pyrodactyl Panel URL

### Set Permissions on Config

```bash
chown -R 8888:8888 /etc/elytra
chmod 755 /etc/elytra
# SECURITY: Config contains daemon credentials - restrict to owner-only read/write
chmod 600 /etc/elytra/config.yml
```

---

## Step 6: Configure SSL/TLS

Elytra requires SSL when connecting to a panel that uses HTTPS. You have two options:

### Option 1: Using Let's Encrypt (Recommended for Production)

```bash
# Install certbot if not already installed
apt install -y certbot  # Ubuntu/Debian
dnf install -y certbot  # Rocky/AlmaLinux

# Obtain certificate
certbot certonly --standalone -d your-daemon-domain.com --agree-tos --email your-email@example.com

# Create symlinks for Elytra
mkdir -p /etc/elytra
ln -sf /etc/letsencrypt/live/your-daemon-domain.com/fullchain.pem /etc/elytra/certificate.pem
ln -sf /etc/letsencrypt/live/your-daemon-domain.com/privkey.pem /etc/elytra/certificate.key

# Set ownership
chown 8888:8888 /etc/elytra/certificate.pem /etc/elytra/certificate.key
chmod 644 /etc/elytra/certificate.pem
chmod 600 /etc/elytra/certificate.key
```

Update `/etc/elytra/config.yml`:
```yaml
api:
    ssl:
        enabled: true
        certificate: /etc/elytra/certificate.pem
        key: /etc/elytra/certificate.key
```

### Option 2: Using Self-Signed Certificate (Testing/Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/elytra/certificate.key \
    -out /etc/elytra/certificate.pem \
    -subj "/CN=your-daemon-domain.com"

# Set ownership
chown 8888:8888 /etc/elytra/certificate.pem /etc/elytra/certificate.key
chmod 644 /etc/elytra/certificate.pem
chmod 600 /etc/elytra/certificate.key
```

### Setup Auto-Renewal (Let's Encrypt)

Create deploy hook:

```bash
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/elytra-restart.sh << 'EOF'
#!/bin/bash
echo "[$(date)] Certificate renewed, restarting Elytra..." >> /var/log/elytra-certbot-renewal.log
systemctl restart elytra
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/elytra-restart.sh
```

---

## Step 7: Create Systemd Service

Create the Elytra service:

```bash
nano /etc/systemd/system/elytra.service
```

Add the following:

```ini
[Unit]
Description=Elytra Daemon
After=docker.service network.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/etc/elytra
LimitNOFILE=4096
PIDFile=/var/run/elytra/daemon.pid
ExecStart=/usr/local/bin/elytra
Restart=on-failure
StartLimitInterval=180
StartLimitBurst=30
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

**Note:** Elytra must run as root to manage Docker containers. The game servers themselves run as UID 8888.

Enable and start:

```bash
systemctl daemon-reload
systemctl enable --now elytra

# Check status
systemctl status elytra
```

---

## Step 8: Firewall Configuration

### Using UFW (Ubuntu/Debian)

```bash
# Default deny
ufw default deny incoming
ufw default allow outgoing

# SSH
ufw allow 22/tcp

# HTTP/HTTPS (for SSL verification)
ufw allow 80/tcp
ufw allow 443/tcp

# Elytra API (if using custom port)
ufw allow 8080/tcp

# SFTP (for file management)
ufw allow 2022/tcp

# Game server ports (adjust based on your needs)
ufw allow 25565:25665/tcp  # Minecraft
ufw allow 25565:25665/udp  # Minecraft
ufw allow 27015:27150/tcp  # Source Engine
ufw allow 27015:27150/udp  # Source Engine

# Enable firewall
ufw enable
```

### Using FirewallD (Rocky/AlmaLinux/RHEL)

```bash
# HTTP/HTTPS
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https

# Elytra API
firewall-cmd --permanent --add-port=8080/tcp

# SFTP
firewall-cmd --permanent --add-port=2022/tcp

# Game server ports (examples)
firewall-cmd --permanent --add-port=25565-25665/tcp  # Minecraft
firewall-cmd --permanent --add-port=25565-25665/udp  # Minecraft
firewall-cmd --permanent --add-port=27015-27150/tcp  # Source Engine
firewall-cmd --permanent --add-port=27015-27150/udp  # Source Engine

# Reload
firewall-cmd --reload
```

---

## Step 8: Connect to Pyrodactyl Panel

### Create Node in Panel

1. Log into your Pyrodactyl Panel
2. Go to **Admin** → **Nodes**
3. Click **Create New**
4. Fill in the details:
   - **Name:** A descriptive name for this node
   - **Location:** Select or create a location
   - **FQDN:** Your daemon's domain (e.g., `daemon.yourdomain.com`)
   - **Behind Proxy:** Check if using Cloudflare or reverse proxy
   - **Memory:** Amount of RAM allocated to this node (in MB)
   - **Disk:** Amount of disk space allocated (in MB)

5. Click **Create Node**

### Get Configuration

After creating the node:

1. Click on the node name to view details
2. Go to the **Configuration** tab
3. Copy the configuration values:
   - `uuid`
   - `token-id`
   - `token`

### Update Elytra Configuration

Edit `/etc/elytra/config.yml` and update the authentication values:

```yaml
uuid: YOUR-UUID-FROM-PANEL
token-id: YOUR-TOKEN-ID-FROM-PANEL
token: YOUR-TOKEN-FROM-PANEL
remote: https://your-panel-domain.com
```

### Restart Elytra

```bash
systemctl restart elytra

# Check logs for connection status
journalctl -u elytra -f
```

You should see logs indicating successful connection to the panel.

---

## Verification

### Check All Services

```bash
# Check Elytra
systemctl status elytra

# Check Docker
systemctl status docker

# View Elytra logs
journalctl -u elytra -n 100

# Check Elytra version
elytra --version

# Verify Docker is working
docker ps
```

### Test Connection to Panel

From the panel:
1. Go to **Admin** → **Nodes**
2. Click on your node
3. Check the **Health** section - it should show as **Healthy**
4. The memory and disk usage should be displayed

### Create Test Allocation

1. In the Panel, go to your Node
2. Click **Allocations** tab
3. Click **Create New**
4. Enter an IP and port (e.g., your server IP and port 25565)
5. Save

This allocation can now be used to create game servers.

---

## Troubleshooting

### Elytra Won't Start

**Check logs:**
```bash
journalctl -u elytra -n 50
```

**Common issues:**

1. **Invalid configuration:**
   ```bash
   # Validate YAML syntax
   cat /etc/elytra/config.yml | head -20
   ```

2. **Docker not running:**
   ```bash
   systemctl status docker
   systemctl start docker
   ```

3. **Port already in use:**
   ```bash
   netstat -tlnp | grep 8080
   # Change port in config if needed
   ```

### Connection to Panel Failed

**Check in logs:**
```bash
journalctl -u elytra -f
```

Look for:
- SSL/TLS errors (certificate issues)
- Authentication failures (wrong token)
- Connection timeouts (firewall/network issues)

**Verify token:**
1. In Panel, go to Node → Settings
2. Click **Reset Daemon Token** if needed
3. Update `/etc/elytra/config.yml`
4. Restart Elytra

### Docker Permission Denied

**Check Docker socket permissions:**
```bash
ls -la /var/run/docker.sock

# Should show root ownership
# If not, fix with:
systemctl restart docker
```

### Game Servers Won't Start

**Check Docker network:**
```bash
docker network ls
docker network inspect bridge
```

**Check for swap:**
```bash
docker info | grep -i swap
```

If swap is not supported, see Step 3 for enabling swap accounting.

**Check resource limits:**
```bash
# View Docker container limits
docker system info
```

---

## Post-Installation Tasks

### Install Common Game Server Eggs

Elytra uses Docker images from the [Parkervcp Eggs repository](https://github.com/parkervcp/eggs). Import common eggs in your Panel:

1. Go to **Admin** → **Nests**
2. Import eggs for games you want to host (Minecraft, CS:GO, etc.)

### Configure Backups (Optional)

Set up automated backups for game servers:

```bash
# Create backup script
mkdir -p /var/backups/elytra
```

### Monitoring (Optional)

Set up basic monitoring:

```bash
# Install netdata (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Or use basic system monitoring
apt install -y htop iotop nethogs
```

---

## Maintenance

### Update Elytra

```bash
# Download latest version
curl -Lo /usr/local/bin/elytra \
    "https://github.com/pyrohost/elytra/releases/latest/download/elytra_linux_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')"

chmod +x /usr/local/bin/elytra

# Restart service
systemctl restart elytra
```

### View Resource Usage

```bash
# Docker stats
docker stats

# System stats
htop

# Disk usage
df -h /var/lib/pyrodactyl
du -sh /var/lib/pyrodactyl/volumes/*
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune -a

# Remove stopped containers
docker container prune

# Full cleanup
docker system prune -a
```

---

## Next Steps

Now that Elytra is installed and connected:

1. **Create allocations** for your node (IP:port combinations)
2. **Create a server** in the Panel
3. **Select the egg** (game type) you want to run
4. **Configure server settings**
5. **Start the server**

For help creating servers and managing them, refer to the Pyrodactyl Panel documentation.

---

## Support

- GitHub Issues: https://github.com/pyrohost/elytra/issues
- Pyrodactyl Documentation: https://github.com/pyrodactyl-oss/pyrodactyl/tree/main/docs
- Docker Documentation: https://docs.docker.com/

---

**Congratulations!** Your Elytra Daemon is now installed and ready to manage game servers.
