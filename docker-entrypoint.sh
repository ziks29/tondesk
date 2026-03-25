#!/bin/sh
set -eu

mkdir -p /app/data
pnpm prisma migrate deploy

exec pnpm start
