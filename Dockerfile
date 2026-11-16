# Multi-stage production Dockerfile for fatturafacile-mcp-server
FROM node:26-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@12

COPY package.json pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

COPY tsconfig*.json ./
COPY src/ ./src/

RUN pnpm run build

# Production runtime stage
FROM node:26-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g pnpm@12

COPY package.json ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/index.js"]
