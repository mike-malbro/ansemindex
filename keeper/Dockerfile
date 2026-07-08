# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.32.1 --activate
COPY package.json ./
RUN pnpm install --no-frozen-lockfile
COPY . .
ENV NODE_ENV=production
ENV HEALTH_PORT=8080
ENV DRY_RUN=true
ENV SIMULATION_MODE=true
EXPOSE 8080
CMD ["node", "src/index.js"]
