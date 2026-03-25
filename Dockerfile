FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN pnpm rebuild better-sqlite3

COPY . .

RUN pnpm prisma generate
RUN pnpm build

RUN mkdir -p /app/data && chmod +x /app/docker-entrypoint.sh

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["./docker-entrypoint.sh"]
