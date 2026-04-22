FROM php:8.3-cli

# System dependencies
# pdo, pdo_sqlite, mbstring, xml, dom are already compiled into php:8.3-cli
# Only install extensions that are NOT pre-bundled: zip, bcmath, pcntl, pdo_mysql
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl unzip libzip-dev \
    && docker-php-ext-install zip bcmath pcntl pdo_mysql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# ── Dependency layer (cached unless lock files change) ────────────────────────
COPY backend-app/composer.json backend-app/composer.lock ./
RUN composer install --no-interaction --no-scripts --optimize-autoloader

COPY backend-app/package.json backend-app/package-lock.json ./
RUN npm ci

# ── Application code ──────────────────────────────────────────────────────────
COPY backend-app/ .

# Run composer post-install scripts now that the full app is present
RUN composer run-script post-autoload-dump --no-interaction 2>/dev/null || true

# Build frontend assets and discard node_modules
RUN npm run build && rm -rf node_modules

EXPOSE 8000

COPY backend-app/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
