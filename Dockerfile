FROM node:20-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY server ./server
COPY public ./public

FROM node:20-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV POCKETBASE_URL=http://127.0.0.1:8090
ENV PB_DATA_DIR=/data/pb
ENV PB_MIGRATIONS_DIR=/app/pb_migrations
ENV POCKETBASE_BIN=/usr/local/bin/pocketbase

ARG POCKETBASE_VERSION=0.22.34

RUN apt-get update && apt-get install -y --no-install-recommends tini wget ca-certificates unzip \
  && rm -rf /var/lib/apt/lists/* \
  && wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_amd64.zip" \
  && unzip -q /tmp/pb.zip -d /usr/local/bin \
  && chmod +x /usr/local/bin/pocketbase \
  && rm /tmp/pb.zip \
  && useradd -r -u 10001 -m appuser

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server
COPY --from=build /app/public ./public
COPY package.json ./
COPY pocketbase/pb_migrations ./pb_migrations
COPY docker/entrypoint.sh /entrypoint.sh

RUN mkdir -p /data/pb && chown -R appuser:appuser /data /app \
  && chmod +x /entrypoint.sh

USER appuser
EXPOSE 3000
VOLUME ["/data"]

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/entrypoint.sh"]
