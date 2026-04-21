#!/bin/sh
set -e

# Ensure SQLite database file exists
mkdir -p /app/database
touch /app/database/database.sqlite

# Ensure storage directories exist
mkdir -p \
    /app/storage/logs \
    /app/storage/framework/cache/data \
    /app/storage/framework/sessions \
    /app/storage/framework/views \
    /app/bootstrap/cache

chmod -R 775 /app/storage /app/bootstrap/cache

# Generate app key if not provided
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Run migrations and seed demo data (idempotent — seeders use firstOrCreate)
php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction

# Start Laravel dev server
exec php artisan serve --host=0.0.0.0 --port=8000
