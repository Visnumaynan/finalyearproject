# Backend App Setup

This folder contains the Laravel backend (with Inertia + Vite assets).

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+ and npm
- mysql (default) or another supported database

## Setup

1. Install PHP dependencies:

```bash
composer install
```

2. Create the environment file:

```bash
copy .env.example .env
```

3. Generate the app key:

```bash
php artisan key:generate
```

4. Create the mysql database :



5. Run migrations:

```bash
php artisan migrate
```

## Run (backend only)

```bash
php artisan serve
```

## Notes

- Change DB settings in .env if you want MySQL/PostgreSQL.
- Frontend build steps are in package.json if needed later.
