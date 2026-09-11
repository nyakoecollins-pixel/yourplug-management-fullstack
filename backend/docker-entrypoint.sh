#!/bin/sh
set -e

echo "Waiting for Postgres..."
until node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL.replace('postgresql://','http://'));
const socket = net.createConnection(url.port || 5432, url.hostname, () => { socket.end(); process.exit(0); });
socket.on('error', () => process.exit(1));
"; do
  sleep 1
done
echo "Postgres is up."

npx prisma generate
npx prisma db push --skip-generate --accept-data-loss
npx tsx prisma/seed.ts

echo "Starting API server..."
npx tsx src/index.ts
