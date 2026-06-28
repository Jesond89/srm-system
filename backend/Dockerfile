# ── Stage 1: instalar dependencias de producción ─────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: imagen final mínima ─────────────────────────────────────────────
FROM node:20-alpine AS runner

# Usuario sin privilegios (seguridad)
RUN addgroup -g 1001 -S nodejs && adduser -S srm -u 1001

WORKDIR /app

# Solo lo necesario: node_modules de prod + código fuente
COPY --from=deps --chown=srm:nodejs /app/node_modules ./node_modules
COPY --chown=srm:nodejs src ./src
COPY --chown=srm:nodejs package.json ./

USER srm

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "src/app.js"]
