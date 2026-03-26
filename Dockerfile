# Build stage
FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b AS build

WORKDIR /app

# Install deps
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Build client (Vite)
RUN npm run build:client

# Build server (TypeScript -> JS)
RUN npx tsc -p tsconfig.server.json

# Production stage
FROM node:24-alpine@sha256:01743339035a5c3c11a373cd7c83aeab6ed1457b55da6a69e014a95ac4e4700b

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# Copy built assets
COPY --from=build /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server/index.js"]
