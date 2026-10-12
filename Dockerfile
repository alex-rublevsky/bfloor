FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

WORKDIR /app

FROM base AS build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked pnpm fetch

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,sharing=locked pnpm install --offline --frozen-lockfile

RUN --mount=type=secret,id=env,required=true sh -eu -c 'set -a; . /run/secrets/env; set +a; pnpm build'

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
