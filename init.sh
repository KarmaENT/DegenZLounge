#!/bin/bash

# Database initialization script for DeGeNz Lounge

# Set environment variables
export PGHOST=${POSTGRES_HOST:-localhost}
export PGPORT=${POSTGRES_PORT:-5432}
export PGDATABASE=${POSTGRES_DB:-degenz}
export PGUSER=${POSTGRES_USER:-postgres}
export PGPASSWORD=${POSTGRES_PASSWORD:-postgres}

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing migrations"

# Create database if it doesn't exist
psql -c "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" | grep -q 1 || psql -c "CREATE DATABASE $PGDATABASE"

# Apply migrations
for migration in $(ls -v migrations/*.sql); do
  echo "Applying migration: $migration"
  psql -d $PGDATABASE -f $migration
done

echo "Database initialization completed successfully"
