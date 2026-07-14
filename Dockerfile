# Stage 0:
# Build the frontend (only if not in dev mode)
FROM --platform=$TARGETOS/$TARGETARCH node:lts-alpine AS frontend
ARG DEV=false
WORKDIR /app
RUN if [ "$DEV" = "false" ]; then \
    apk add --no-cache git \
    && npm install -g corepack@latest turbo \
    && corepack enable \
    && echo "Building frontend"; \
    fi
COPY pnpm-lock.yaml package.json ./
RUN if [ "$DEV" = "false" ]; then \
    pnpm fetch \
    && echo "Fetched dependencies"; \
    fi
COPY . .
RUN if [ "$DEV" = "false" ]; then \
    pnpm install --frozen-lockfile \
    && pnpm run ship; \
    fi

# Stage 1:
# Build the actual container with all of the needed PHP dependencies that will run the application
FROM --platform=$TARGETOS/$TARGETARCH php:8.5-fpm-alpine AS php
ARG DEV=false
WORKDIR /app

# Build-time deps & PHP extensions
RUN apk add --no-cache --virtual .build-deps \
    libpng-dev libxml2-dev libzip-dev postgresql18-dev \
    && docker-php-ext-configure zip \
    && docker-php-ext-install bcmath gd pdo pdo_mysql pdo_pgsql zip \
    && apk del .build-deps \
    && apk add --no-cache \
    libpng libxml2 libzip libpq

# Runtime packages
RUN apk add --no-cache \
    ca-certificates curl git supervisor nginx dcron \
    tar unzip mysql-client postgresql18-client \
    && ln -s /bin/ash /bin/bash

# Copy frontend build
COPY . ./
RUN if [ "$DEV" = "false" ]; then \
    echo "Copying frontend build"; \
    else \
    mkdir -p public/assets public/build; \
    fi
COPY --from=frontend /app/public/assets public/assets
COPY --from=frontend /app/public/build public/build

# Fetch & install Composer packages
COPY composer.json composer.lock ./
RUN curl -sS https://getcomposer.org/installer \
    | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader

# Clean up image for dev environment
# This is because we share local files with the container
RUN if [ "$DEV" = "true" ]; then \
    echo "Cleaning up"; \
    find . \
    -mindepth 1 \
    \( -path './vendor*' \) -prune \
    -o \
    -exec rm -rf -- {} \; \
    >/dev/null 2>&1; \
    fi; \
    exit 0

# Env, directories, permissions
RUN mkdir -p bootstrap/cache storage/logs storage/framework/sessions storage/framework/views storage/framework/cache; \
    rm -rf bootstrap/cache/*.php; \
    chown -R nginx:nginx .; \
    chmod -R 777 bootstrap storage; \
    cp .env.example .env || true;

# Cron jobs & NGINX tweaks
RUN rm /usr/local/etc/php-fpm.conf \
    && { \
    echo "* * * * * /usr/local/bin/php /app/artisan schedule:run >> /dev/null 2>&1"; \
    } > /var/spool/cron/crontabs/root \
    && mkdir -p /var/run/php /var/run/nginx

# Configs
COPY --chown=nginx:nginx .github/docker/default.conf /etc/nginx/http.d/default.conf
COPY --chown=nginx:nginx .github/docker/www.conf     /usr/local/etc/php-fpm.conf
COPY --chown=nginx:nginx .github/docker/supervisord.conf /etc/supervisord.conf

RUN rm -rf bootstrap/cache/*.php \
    && rm -rf storage/framework/* || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

ENTRYPOINT [ "/bin/ash", ".github/docker/entrypoint.sh" ]
CMD [ "supervisord", "-n", "-c", "/etc/supervisord.conf" ]
