#!/bin/bash
# Script to seed GTM mock data on Render
# Run this in Render's shell: bash scripts/seed-gtm-render.sh

PROJECT_ID="66aeff0ea380c590e96e8e70"

echo "Seeding GTM mock data for project: $PROJECT_ID"
echo "Using DATABASE_URL from environment..."

node scripts/seed-gtm-mock-data.js "$PROJECT_ID"

