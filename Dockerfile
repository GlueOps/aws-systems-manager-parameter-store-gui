# Build stage
FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS build

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
FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# Copy built assets
COPY --from=build /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server/index.js"]
