FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

WORKDIR /app

FROM base AS build

ARG PUBLIC_GOOGLE_CLIENT_ID
ARG SECRET_GOOGLE_CLIENT
ARG PUBLIC_BETTER_AUTH_URL
ARG SECRET_BETTER_AUTH
ARG SECRET_ADMIN_EMAILS
ARG PUBLIC_YANDEX_STORAGE_BUCKET
ARG PUBLIC_TURSO_DATABASE_URL
ARG SECRET_TURSO_AUTH_TOKEN

ENV PUBLIC_GOOGLE_CLIENT_ID=$PUBLIC_GOOGLE_CLIENT_ID \
    SECRET_GOOGLE_CLIENT=$SECRET_GOOGLE_CLIENT \
    PUBLIC_BETTER_AUTH_URL=$PUBLIC_BETTER_AUTH_URL \
    SECRET_BETTER_AUTH=$SECRET_BETTER_AUTH \
    SECRET_ADMIN_EMAILS=$SECRET_ADMIN_EMAILS \
    PUBLIC_YANDEX_STORAGE_BUCKET=$PUBLIC_YANDEX_STORAGE_BUCKET \
    PUBLIC_TURSO_DATABASE_URL=$PUBLIC_TURSO_DATABASE_URL \
    SECRET_TURSO_AUTH_TOKEN=$SECRET_TURSO_AUTH_TOKEN

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked pnpm fetch

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked pnpm install --offline --frozen-lockfile

RUN pnpm build

# remove devDeps
RUN pnpm prune --prod

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 8080

CMD ["node", "./dist/server/entry.mjs"]
