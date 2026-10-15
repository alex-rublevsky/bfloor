# syntax=docker/dockerfile:1.10

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

WORKDIR /app

FROM base AS build

ARG PUBLIC_GOOGLE_CLIENT_ID
ARG PUBLIC_BETTER_AUTH_URL
ARG S3_BUCKET_NAME
ARG PUBLIC_TURSO_DATABASE_URL

ENV PUBLIC_GOOGLE_CLIENT_ID=$PUBLIC_GOOGLE_CLIENT_ID \
    PUBLIC_BETTER_AUTH_URL=$PUBLIC_BETTER_AUTH_URL \
    S3_BUCKET_NAME=$S3_BUCKET_NAME \
    PUBLIC_TURSO_DATABASE_URL=$PUBLIC_TURSO_DATABASE_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked pnpm fetch

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked pnpm install --offline --frozen-lockfile

RUN --mount=type=secret,id=SECRET_GOOGLE_CLIENT,env=SECRET_GOOGLE_CLIENT,required=true \
    --mount=type=secret,id=SECRET_BETTER_AUTH,env=SECRET_BETTER_AUTH,required=true \
    --mount=type=secret,id=SECRET_ADMIN_EMAILS,env=SECRET_ADMIN_EMAILS,required=true \
    --mount=type=secret,id=SECRET_TURSO_AUTH_TOKEN,env=SECRET_TURSO_AUTH_TOKEN,required=true \
    --mount=type=secret,id=S3_ACCESS_KEY,env=S3_ACCESS_KEY,required=true \
    --mount=type=secret,id=S3_SECRET_ACCESS_KEY,env=S3_SECRET_ACCESS_KEY,required=true \
    pnpm build

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
