# --- Stage 1: Build Admin Client ---
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Build Server ---
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# --- Stage 3: Production Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/signage.db"
ENV UPLOAD_DIR="/app/uploads"

# Copy built server and dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/prisma ./prisma
COPY --from=server-builder /app/server/node_modules/.prisma ./node_modules/.prisma
COPY --from=server-builder /app/server/node_modules/@prisma ./node_modules/@prisma

# Copy built frontend assets and player client
WORKDIR /app
COPY --from=client-builder /app/client/dist ./client/dist
COPY player/ ./player/

# Create persistent storage directories
RUN mkdir -p /app/data /app/uploads

EXPOSE 3001

WORKDIR /app/server
CMD ["node", "dist/index.js"]

