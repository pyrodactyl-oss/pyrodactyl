# Pyrodactyl Panel - Manual Installation Guide

This guide provides step-by-step instructions for manually installing the Pyrodactyl Panel on your server. Pyrodactyl is a modern, open-source game server management panel built with PHP and Laravel.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites](#prerequisites)
3. [Step 1: System Updates](#step-1-system-updates)
4. [Step 2: Install Required Packages](#step-2-install-required-packages)
5. [Step 3: Configure MariaDB Database](#step-3-configure-mariadb-database)
6. [Step 4: Configure Redis](#step-4-configure-redis)
7. [Step 5: Download and Configure Pyrodactyl](#step-5-download-and-configure-pyrodactyl)
8. [Step 6: Configure Nginx](#step-6-configure-nginx)
9. [Step 7: SSL/TLS Configuration](#step-7-ssltls-configuration)
10. [Step 8: Queue Worker Setup](#step-8-queue-worker-setup)
11. [Step 9: Cron Job Setup](#step-9-cron-job-setup)
12. [Step 10: Firewall Configuration](#step-10-firewall-configuration)
13. [Verification](#verification)
14. [Troubleshooting](#troubleshooting)

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

### Recommended Requirements
| Component | Specification |
|-----------|--------------|
| **CPU** | 4+ cores |
| **RAM** | 4+ GB |
| **Storage** | 50+ GB SSD |
| **Network** | Both IPv4 and IPv6 |

---

## Prerequisites

Before beginning, ensure you have:
- A server with root access
- A registered domain name pointed to your server
- Basic familiarity with Linux command line

---

## Step 1: System Updates

Update your system packages to the latest versions:

```bash
# Ubuntu/Debian
apt update && apt upgrade -y

# Rocky Linux/AlmaLinux/RHEL
dnf update -y
```

---

## Step 2: Install Required Packages

### Ubuntu/Debian

Add the Ondrej PHP repository and install packages:

```bash
# Install prerequisite packages
apt install -y software-properties-common apt-transport-https ca-certificates gnupg2 curl

# Add Ondrej PHP PPA
LC_ALL=C.UTF-8 add-apt-repository -y ppa:ondrej/php
apt update

# Install PHP 8.4 and extensions
apt install -y php8.4-fpm php8.4-cli php8.4-gd php8.4-mysql \
  php8.4-pdo php8.4-mbstring php8.4-tokenizer php8.4-bcmath \
  php8.4-xml php8.4-curl php8.4-zip php8.4-intl php8.4-redis

# Install other required packages
apt install -y nginx mariadb-server redis-server curl tar unzip git \
  certbot python3-certbot-nginx jq
```

### Debian (without PPA)

```bash
apt install -y dirmngr ca-certificates apt-transport-https lsb-release
curl -fsSL -o /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/php.list
apt update

apt install -y php8.4-fpm php8.4-cli php8.4-gd php8.4-mysql \
  php8.4-pdo php8.4-mbstring php8.4-tokenizer php8.4-bcmath \
  php8.4-xml php8.4-curl php8.4-zip php8.4-intl php8.4-redis

apt install -y nginx mariadb-server redis-server curl tar unzip git \
  certbot python3-certbot-nginx jq
```

### Rocky Linux/AlmaLinux/RHEL

```bash
# Install EPEL and Remi repositories
dnf install -y epel-release
dnf install -y "https://rpms.remirepo.net/enterprise/remi-release-$(rpm -E %rhel).rpm"

# Enable PHP 8.4 module
dnf module reset php -y
dnf module enable php:remi-8.4 -y

# Install packages
dnf install -y php php-fpm php-cli php-gd php-mysqlnd php-pdo \
  php-mbstring php-tokenizer php-bcmath php-xml php-curl php-zip \
  php-intl php-redis

dnf install -y nginx mariadb-server redis curl tar unzip git \
  certbot python3-certbot-nginx jq
```

---

## Step 3: Configure MariaDB Database

### Start MariaDB Service

```bash
systemctl enable --now mariadb
```

### Secure MariaDB Installation

Run the security script:

```bash
mysql_secure_installation
```

Or manually configure:

```bash
# Set root password
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_secure_root_password';"

# Remove anonymous users
mysql -e "DELETE FROM mysql.user WHERE User='';"

# Remove test database
mysql -e "DROP DATABASE IF EXISTS test;"

# Reload privileges
mysql -e "FLUSH PRIVILEGES;"
```

### Create Database and User

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE panel;"

# Create user
mysql -u root -p -e "CREATE USER 'pyrodactyl'@'127.0.0.1' IDENTIFIED BY 'your_secure_db_password';"

# Grant privileges
mysql -u root -p -e "GRANT ALL PRIVILEGES ON panel.* TO 'pyrodactyl'@'127.0.0.1' WITH GRANT OPTION;"

# Flush privileges
mysql -u root -p -e "FLUSH PRIVILEGES;"
```

Save these credentials securely for later use.

---

## Step 4: Configure Redis

Enable and start Redis:

```bash
systemctl enable --now redis-server
```

Verify Redis is running:

```bash
systemctl status redis-server
```

---

## Step 5: Download and Configure Pyrodactyl

### Create Directory Structure

```bash
mkdir -p /var/www/pyrodactyl
cd /var/www/pyrodactyl
```

### Download Latest Release

```bash
# Get the latest release URL from GitHub
LATEST_URL=$(curl -s https://api.github.com/repos/pyrodactyl-oss/pyrodactyl/releases/latest | grep "tarball_url" | cut -d'"' -f4)

# Download and extract
curl -Lo panel.tar.gz "$LATEST_URL"
tar -xzf panel.tar.gz --strip-components=1
rm panel.tar.gz
```

### Set Proper Permissions

```bash
chown -R www-data:www-data /var/www/pyrodactyl
chmod -R 755 /var/www/pyrodactyl
```

### Install Composer Dependencies

```bash
# Install Composer if not present
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install dependencies
cd /var/www/pyrodactyl
composer install --no-dev --optimize-autoloader
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```bash
nano /var/www/pyrodactyl/.env
```

Required changes:

```ini
APP_URL=https://your-domain.com
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=panel
DB_USERNAME=pyrodactyl
DB_PASSWORD=your_secure_db_password
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### Generate Application Key

```bash
cd /var/www/pyrodactyl
php artisan key:generate --force
```

### Run Database Migrations

```bash
php artisan migrate --seed --force
```

### Create Admin User

```bash
php artisan p:user:make
```

Follow the prompts to create your admin account.

### Optimize Laravel

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Step 6: Configure Nginx

### Create Nginx Configuration

Create a new configuration file:

```bash
nano /etc/nginx/sites-available/pyrodactyl
```

Add the following configuration (adjust for your domain):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    root /var/www/pyrodactyl/public;
    index index.php;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        # Debian/Ubuntu: unix:/run/php/php8.4-fpm.sock
        # Rocky/Alma/RHEL: unix:/run/php-fpm/www.sock
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_read_timeout 300;
    }

    location ~ /\.ht {
        deny all;
    }

    # Static file caching
    location ~* \.(?:css|js|woff|woff2|ttf|otf|eot|svg|png|jpg|jpeg|gif|ico)$ {
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
}
```

### Enable the Site

**Debian/Ubuntu:**
```bash
ln -s /etc/nginx/sites-available/pyrodactyl /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**Rocky Linux/AlmaLinux/RHEL:**
On RHEL-family distributions, nginx uses `/etc/nginx/conf.d/` instead of `sites-available`/`sites-enabled`:

```bash
# Copy the config to conf.d (sites-enabled pattern doesn't exist)
cp /etc/nginx/sites-available/pyrodactyl /etc/nginx/conf.d/pyrodactyl.conf
# Remove the default server block if it conflicts
rm -f /etc/nginx/conf.d/default.conf
nginx -t
systemctl restart nginx
```

---

## Step 7: SSL/TLS Configuration

### Using Let's Encrypt (Recommended)

```bash
certbot --nginx -d your-domain.com --non-interactive --agree-tos --email your-email@example.com
```

### Auto-Renewal Setup

Certbot typically sets up auto-renewal automatically. Verify:

```bash
systemctl status certbot.timer
```

If using cron instead, add:

```bash
echo "0 0,12 * * * root certbot renew --quiet --deploy-hook 'systemctl restart nginx'" | tee -a /etc/crontab
```

### Deploy Hook for Service Restart

Create a hook to restart services after renewal:

```bash
mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/pyrodactyl-services.sh << 'EOF'
#!/bin/bash
echo "[$(date)] Certificate renewed" >> /var/log/pyrodactyl-certbot-renewal.log
systemctl restart nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/pyrodactyl-services.sh
```

---

## Step 8: Queue Worker Setup

### Create Systemd Service

Create the service file:

```bash
nano /etc/systemd/system/pyroq.service
```

Add the following content:

```ini
[Unit]
Description=Pyrodactyl Queue Worker
After=redis-server.service mariadb.service
Requires=redis-server.service

[Service]
Type=simple
User=www-data
Group=www-data
Restart=always
RestartSec=5s
StartLimitInterval=180
StartLimitBurst=30

TimeoutStartSec=0
TimeoutStopSec=120
KillSignal=SIGTERM
KillMode=process

# Memory leak prevention: restart after 1 hour or 1000 jobs
ExecStart=/usr/bin/php /var/www/pyrodactyl/artisan queue:work --queue=high,standard,low --sleep=3 --tries=3 --max-time=3600 --max-jobs=1000 --memory=512

OOMScoreAdjust=-100

ExecStop=/bin/kill -TERM $MAINPID
TimeoutStopSec=120
SendSIGKILL=yes

LimitAS=1G
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
```

### Enable and Start Service

```bash
systemctl daemon-reload
systemctl enable --now pyroq
```

Verify it's running:

```bash
systemctl status pyroq
```

---

## Step 9: Cron Job Setup

Set up the scheduler for Pyrodactyl:

```bash
crontab -e
```

Add this line:

```cron
* * * * * cd /var/www/pyrodactyl && php artisan schedule:run >> /dev/null 2>&1
```

---

## Step 10: Firewall Configuration

### Using UFW (Ubuntu/Debian)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### Using FirewallD (Rocky/AlmaLinux/RHEL)

```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## Verification

### Check All Services

```bash
# Check Nginx
systemctl status nginx

# Check PHP-FPM
systemctl status php8.4-fpm

# Check MariaDB
systemctl status mariadb

# Check Redis
systemctl status redis-server

# Check Queue Worker
systemctl status pyroq
```

### Test Panel Accessibility

Visit `https://your-domain.com` in your browser. You should see the Pyrodactyl login page.

### Check Panel Health

```bash
cd /var/www/pyrodactyl
php artisan p:info
```

### Verify Queue Worker

```bash
# Check for failed jobs
php artisan queue:failed

# Check queue status
php artisan queue:monitor
```

---

## Troubleshooting

### 502 Bad Gateway Error

1. Check PHP-FPM is running:
   ```bash
   systemctl status php8.4-fpm
   ```

2. Verify socket path in Nginx config matches PHP-FPM:
   ```bash
   grep "listen" /etc/php/8.4/fpm/pool.d/www.conf
   ```

### Permission Denied Errors

Fix permissions:
```bash
chown -R www-data:www-data /var/www/pyrodactyl
# Set 755 on directories and 644 on files
find /var/www/pyrodactyl/storage -type d -exec chmod 755 {} \;
find /var/www/pyrodactyl/storage -type f -exec chmod 644 {} \;
find /var/www/pyrodactyl/bootstrap/cache -type d -exec chmod 755 {} \;
find /var/www/pyrodactyl/bootstrap/cache -type f -exec chmod 644 {} \;
```

### Database Connection Errors

Verify credentials in `.env` and test:
```bash
mysql -u pyrodactyl -p -h 127.0.0.1 panel -e "SELECT 1"
```

### Queue Worker Not Processing Jobs

Check logs:
```bash
journalctl -u pyroq -f
```

Restart and check status:
```bash
systemctl restart pyroq
systemctl status pyroq
```

---

## Post-Installation

### Recommended: Install phpMyAdmin (Optional)

```bash
apt install phpmyadmin
```

### Recommended: Set Up Swap

If your system has less than 4GB RAM, create swap:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile swap swap defaults 0 0" >> /etc/fstab
sysctl vm.swappiness=10
echo "vm.swappiness=10" >> /etc/sysctl.conf
```

### Backup Strategy

Set up automated backups:

```bash
mkdir -p /var/backups/pyrodactyl
mysqldump -u root -p panel > /var/backups/pyrodactyl/panel-$(date +%Y%m%d).sql
tar -czf /var/backups/pyrodactyl/panel-files-$(date +%Y%m%d).tar.gz /var/www/pyrodactyl
```

---

## Next Steps

Now that your panel is installed, you can:

1. Log in with your admin credentials
2. Create locations and nodes
3. Configure your first game server
4. Install Elytra (the daemon) on your game server nodes

For Elytra installation, refer to the [Elytra Manual Installation Guide](./elytra-manual.md).

---

## Support

- GitHub Issues: https://github.com/pyrodactyl-oss/pyrodactyl/issues
- Documentation: https://github.com/pyrodactyl-oss/pyrodactyl/tree/main/docs
- Discord: [Pyrodactyl Community Discord]

---

**Congratulations!** Your Pyrodactyl Panel is now installed and ready to use.
