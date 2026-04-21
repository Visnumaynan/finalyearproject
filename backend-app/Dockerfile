FROM php:8.3-cli

# System dependencies
# pdo, pdo_sqlite, mbstring, xml, dom are already compiled into php:8.3-cli
# Only install extensions that are NOT pre-bundled: zip, bcmath, pcntl
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl unzip libzip-dev \
    && docker-php-ext-install zip bcmath pcntl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy application (build context = project root)
COPY backend-app/ .

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader

# Install JS dependencies and build frontend assets
RUN npm ci && npm run build && rm -rf node_modules

EXPOSE 8000

COPY backend-app/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
