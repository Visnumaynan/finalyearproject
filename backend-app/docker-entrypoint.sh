#!/bin/sh
set -e

# Ensure storage directories exist
mkdir -p \
    /app/storage/logs \
    /app/storage/framework/cache/data \
    /app/storage/framework/sessions \
    /app/storage/framework/views \
    /app/bootstrap/cache

chmod -R 775 /app/storage /app/bootstrap/cache

# Generate app key if not provided (--show prints it without needing a .env file)
if [ -z "$APP_KEY" ]; then
    APP_KEY=$(php artisan key:generate --show --no-ansi 2>/dev/null)
    export APP_KEY
fi

# Cache config and routes for faster startup
php artisan config:cache
php artisan route:cache

# Run migrations and seed demo data (idempotent — seeders skip existing records)
php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction

# Start Laravel dev server
exec php artisan serve --host=0.0.0.0 --port=8000
