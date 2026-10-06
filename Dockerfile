# Backend image (server/ workspace). Build context is the repo root so the lockfile is shared.
# Deploy: gcloud run deploy braindy-api --source . (see docs/phase-0.md)
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --workspace server --include-workspace-root=false
COPY server server
RUN npm run build -w server

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --workspace server --include-workspace-root=false --omit=dev
COPY --from=build /app/server/dist server/dist
USER node
CMD ["node", "server/dist/index.js"]
