#!/bin/bash

set -e

# shellcheck source=lib/lib.sh
source /tmp/pyrodactyl-lib.sh

# Configuration
PANEL_DIR="/var/www/pyrodactyl"
ELYTRA_DIR="/etc/elytra"
PANEL_DATA_DIR="/var/lib/pyrodactyl"

remove_panel() {
    print_flame "Removing Pyrodactyl Panel"

    # Stop services
    output "Stopping panel services..."
    systemctl stop pyroq 2>/dev/null || true
    systemctl disable pyroq 2>/dev/null || true

    # Remove nginx config
    output "Removing nginx configuration..."
    rm -f /etc/nginx/sites-available/pyrodactyl.conf
    rm -f /etc/nginx/sites-enabled/pyrodactyl.conf

    # Reload nginx if it's running
    if systemctl is-active --quiet nginx; then
        nginx -t && systemctl reload nginx
    fi

    # Remove panel files
    if [ -d "$PANEL_DIR" ]; then
        output "Removing panel files..."
        rm -rf "$PANEL_DIR"
    fi

    # Remove systemd service
    rm -f /etc/systemd/system/pyroq.service
    systemctl daemon-reload

    # Remove cron job
    crontab -l 2>/dev/null | grep -v "pyrodactyl" | crontab - 2>/dev/null || true

    # Remove SSL certificates if Let's Encrypt was used
    if [ -d "/etc/letsencrypt" ]; then
        output "Checking for Let's Encrypt certificates..."
        certbot delete --cert-name "$(hostname -f)" 2>/dev/null || true
    fi

    success "Panel removed"
}

remove_elytra() {
    print_flame "Removing Elytra"

    # Stop and remove service
    output "Stopping Elytra service..."
    systemctl stop elytra 2>/dev/null || true
    systemctl disable elytra 2>/dev/null || true

    # Remove binary
    output "Removing Elytra binary..."
    rm -f /usr/local/bin/elytra

    # Remove configuration
    if [ -d "$ELYTRA_DIR" ]; then
        output "Removing Elytra configuration..."
        rm -rf "$ELYTRA_DIR"
    fi

    # Stop and remove all game servers (Docker containers)
    output "Stopping all game servers..."
    docker ps -q --filter "name=fly-" | xargs -r docker stop 2>/dev/null || true
    docker ps -aq --filter "name=fly-" | xargs -r docker rm 2>/dev/null || true

    # Remove systemd service
    rm -f /etc/systemd/system/elytra.service
    systemctl daemon-reload

    # Remove Elytra data directory
    if [ -d "/var/lib/elytra" ]; then
        output "Removing Elytra data directory..."
        rm -rf /var/lib/elytra
    fi

    # Remove Elytra version file
    rm -f /etc/pyrodactyl/elytra-version

    # Remove pyrodactyl user (if it exists)
    if id -u pyrodactyl >/dev/null 2>&1; then
        output "Removing pyrodactyl user..."
        userdel pyrodactyl 2>/dev/null || true
        groupdel pyrodactyl 2>/dev/null || true
    fi

    success "Elytra removed"
}

remove_auto_updaters() {
    print_flame "Removing Auto-Updaters"

    # Remove panel auto-updater
    remove_auto_updater_panel

    # Remove Elytra auto-updater
    remove_auto_updater_elytra

    # Remove backup directories
    rm -rf /var/backups/pyrodactyl
    rm -rf /var/backups/elytra

    # Remove /etc/pyrodactyl directory if empty
    if [ -d "/etc/pyrodactyl" ]; then
        rmdir /etc/pyrodactyl 2>/dev/null || true
    fi

    success "Auto-updaters removed"
}

remove_database() {
    print_flame "Removing Database"

    output "This will remove the panel database and database user."

    if [ -f /root/.config/pyrodactyl/db-credentials ]; then
        local db_root_pass
        db_root_pass=$(grep '^root:' /root/.config/pyrodactyl/db-credentials | cut -d':' -f2)

        # Drop database
        output "Dropping database 'panel'..."
        mysql -u root -p"${db_root_pass}" -e "DROP DATABASE IF EXISTS panel;" 2>/dev/null || warning "Could not drop database"

        # Drop user
        output "Dropping database user..."
        mysql -u root -p"${db_root_pass}" -e "DROP USER IF EXISTS 'pyrodactyl'@'localhost';" 2>/dev/null || true
        mysql -u root -p"${db_root_pass}" -e "DROP USER IF EXISTS 'pyrodactyl'@'127.0.0.1';" 2>/dev/null || true
        mysql -u root -p"${db_root_pass}" -e "DROP USER IF EXISTS 'pyrodactyl'@'%';" 2>/dev/null || true
        mysql -u root -p"${db_root_pass}" -e "FLUSH PRIVILEGES;" 2>/dev/null || true

        # Remove credentials file
        rm -f /root/.config/pyrodactyl/db-credentials
        rmdir /root/.config/pyrodactyl 2>/dev/null || true
        rmdir /root/.config 2>/dev/null || true

        success "Database removed"
    else
        warning "Database credentials not found. You may need to manually remove the database."
    fi
}

remove_phpmyadmin() {
    print_flame "Removing phpMyAdmin"

    output "Removing phpMyAdmin configuration..."

    # Get root password if available
    local db_root_pass=""
    if [ -f /root/.config/pyrodactyl/db-credentials ]; then
        db_root_pass=$(grep '^root:' /root/.config/pyrodactyl/db-credentials | cut -d':' -f2)
    fi

    # Drop phpmyadmin database users
    if [ -n "$db_root_pass" ]; then
        output "Dropping phpMyAdmin database users..."
        mysql -u root -p"${db_root_pass}" -e "DROP USER IF EXISTS 'phpmyadmin'@'localhost';" 2>/dev/null || true
        mysql -u root -p"${db_root_pass}" -e "DROP USER IF EXISTS 'phpmyadmin'@'127.0.0.1';" 2>/dev/null || true
        mysql -u root -p"${db_root_pass}" -e "DROP USER IF EXISTS 'phpmyadmin'@'%';" 2>/dev/null || true
        mysql -u root -p"${db_root_pass}" -e "FLUSH PRIVILEGES;" 2>/dev/null || true
    fi

    # Remove nginx config
    rm -f /etc/nginx/sites-available/phpmyadmin.conf
    rm -f /etc/nginx/sites-enabled/phpmyadmin.conf

    # Reload nginx
    if systemctl is-active --quiet nginx; then
        nginx -t && systemctl reload nginx
    fi

    # Remove phpMyAdmin config files
    rm -f /etc/phpmyadmin/conf.d/99-custom.php

    # Remove phpMyAdmin credentials from file
    if [ -f /root/.config/pyrodactyl/db-credentials ]; then
        sed -i '/^phpmyadmin:/d' /root/.config/pyrodactyl/db-credentials
    fi

    # Purge debconf database for clean reinstall
    output "Purging phpMyAdmin debconf database..."
    echo "PURGE" | debconf-communicate phpmyadmin 2>/dev/null || true

    success "phpMyAdmin configuration removed"
}

remove_data() {
    print_flame "Removing Data Files"

    output "This will remove all server data, backups, and eggs."

    if [ -d "$PANEL_DATA_DIR" ]; then
        output "Removing data directory: $PANEL_DATA_DIR"
        rm -rf "$PANEL_DATA_DIR"
    fi

    # Remove any remaining Docker volumes
    output "Removing Docker volumes..."
    docker volume ls -q --filter "name=pyrodactyl" | xargs -r docker volume rm 2>/dev/null || true

    success "Data files removed"
}

cleanup_packages() {
    print_flame "Cleaning up packages"

    output "Would you like to remove the installed packages (nginx, php, mariadb, etc.)?"
    output "Warning: This may affect other services on your system."

    local remove_packages=""
    bool_input remove_packages "Remove packages?" "n"

    if [ "$remove_packages" == "y" ]; then
        output "Removing packages..."

        case "$OS" in
            ubuntu | debian)
                apt-get remove -y \
                    php8.4-fpm php8.4-cli php8.4-gd php8.4-mysql \
                    php8.4-pdo php8.4-mbstring php8.4-tokenizer \
                    php8.4-bcmath php8.4-xml php8.4-curl php8.4-zip \
                    php8.4-intl php8.4-redis php8.4-sqlite3 \
                    nginx mariadb-server redis-server \
                    2>/dev/null || warning "Some packages may not have been installed"

                apt-get autoremove -y
                ;;

            rocky | almalinux)
                dnf remove -y \
                    php-fpm php-cli php-gd php-mysqlnd \
                    php-pdo php-mbstring php-tokenizer \
                    php-bcmath php-xml php-curl php-zip \
                    php-intl php-redis php-sqlite3 \
                    nginx mariadb-server redis \
                    2>/dev/null || warning "Some packages may not have been installed"
                ;;
        esac

        success "Packages removed"
    fi
}

main() {
    print_header
    print_flame "Starting Uninstallation"

    # Remove components based on what was requested
    if [ "$REMOVE_AUTO_UPDATERS" == "true" ]; then
        remove_auto_updaters
    fi

    if [ "$REMOVE_PANEL" == "true" ]; then
        remove_panel
        remove_phpmyadmin
    fi

    if [ "$REMOVE_ELYTRA" == "true" ]; then
        remove_elytra
    fi

    if [ "$REMOVE_DATABASE" == "true" ]; then
        remove_database
    fi

    if [ "$REMOVE_DATA" == "true" ]; then
        remove_data
    fi

    # Ask about package cleanup only if removing everything
    if [ "$REMOVE_PANEL" == "true" ] && [ "$REMOVE_ELYTRA" == "true" ]; then
        cleanup_packages
    fi

    print_header
    print_flame "Uninstallation Complete!"

    echo ""
    output "Pyrodactyl has been uninstalled from your system."
    output ""
    output "Note: Some configuration files may remain in:"
    output "  ${COLOR_ORANGE}/etc/nginx/${COLOR_NC}"
    output "  ${COLOR_ORANGE}/etc/mysql/${COLOR_NC}"
    output "  ${COLOR_ORANGE}/etc/redis/${COLOR_NC}"
    output ""
    output "If you no longer need these services, you can remove them manually."

    print_brake 70
}

main
