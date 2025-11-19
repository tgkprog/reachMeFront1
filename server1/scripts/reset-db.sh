#!/bin/bash
# Database Reset Script
# Drops and recreates all tables

set -e

echo "🗄️  Database Reset Script"
echo "========================"
echo ""

# Load environment
export env=${env:-local}
echo "Environment: $env"

# Source the appropriate .env file
if [ -f ".${env}.env" ]; then
    source ".${env}.env"
    echo "✅ Loaded .${env}.env"
else
    source ".env"
    echo "✅ Loaded .env"
fi

echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "User: $DB_USER"
echo ""

read -p "⚠️  This will DROP all tables and recreate them. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "🔄 Executing schema_full.sql..."

mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PWD" "$DB_NAME" < db/ddl.sql

if [ $? -eq 0 ]; then
    echo "✅ Database DDL complete!"
else
    echo "❌ Database DDL failed"
    exit 1
fi

mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PWD" "$DB_NAME" < db/data.sql


if [ $? -eq 0 ]; then
    echo "✅ Database data complete!"
else
    echo "❌ Database Data failed"
    exit 1
fi
