# syntax=docker/dockerfile:1.7
# Image production TAMI: build 1 lần, dùng chung cho service `app` (next start) và `jobs` (pnpm jobs),
# rồi promote staging -> prod (ARCHITECTURE §6.4). Cấu hình theo môi trường đọc LÚC CHẠY, không nhúng lúc build.
# Build (context = gốc repo):  docker build -f docker/Dockerfile -t tami-web:<git-sha> .
# Cần mạng ra ngoài: `next build` tải font từ Google Fonts (src/lib/fonts.ts).

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 CI=true
# Cài pnpm toàn cục (theo `packageManager` trong package.json) để chạy lệnh quản trị bằng `pnpm` khi cần; service compose gọi node trực tiếp (xử lý SIGTERM đúng).
RUN npm install -g pnpm@9.15.0 && npm cache clean --force

# Toàn bộ dependency (kể cả dev) để build.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=tami-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
# Giá trị dưới đây chỉ để `next build` import được cấu hình (không kết nối DB/Redis/S3 lúc build);
# chúng KHÔNG nằm trong image cuối (stage runner không copy env từ stage này).
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build \
    PAYLOAD_SECRET=build-time-placeholder-not-a-secret \
    REDIS_URL=redis://127.0.0.1:6379 \
    S3_ENDPOINT=http://127.0.0.1:8333 \
    S3_ACCESS_KEY_ID=build S3_SECRET_ACCESS_KEY=build \
    S3_BUCKET_PUBLIC=public S3_BUCKET_PRIVATE=private \
    TURNSTILE_SITE_KEY=build TURNSTILE_SECRET_KEY=build \
    SMTP_HOST=build SMTP_USER=build SMTP_PASS=build \
    ANTHROPIC_API_KEY=build TRANSLATION_MODEL=build TRANSLATION_MONTHLY_BUDGET_USD=0 \
    NEXT_PUBLIC_SITE_URL=http://localhost:3000
# NEXT_PUBLIC_SITE_URL ở trên chỉ là placeholder để qua validate lúc build. Code đọc URL gốc LÚC CHẠY (src/lib/seo/site-url.ts, khoá động
# nên Next không nhúng giá trị này vào bundle) và bỏ URL tuyệt đối trong HTML prerender lúc build; giá trị thật do compose cấp mỗi môi trường.
# Source map trình duyệt: chỉ sinh + upload lên GlitchTip khi có secret `glitchtip_auth_token` (+ build-arg url/org/project);
# không có secret thì `pnpm build` không sinh `.map`. Token đi qua secret mount (không vào layer/history), `.map` luôn bị xoá khỏi image.
# Biến BUILD (Next nhúng vào bundle lúc build; đổi giá trị = build lại): số hotline cho src/app/global-error.tsx khi DB lỗi (design-spec S18).
# CI lấy từ GitHub variable NEXT_PUBLIC_HOTLINE (deploy.yml build-args); rỗng = trang lỗi không hiện số.
ARG NEXT_PUBLIC_HOTLINE=""
ENV NEXT_PUBLIC_HOTLINE=$NEXT_PUBLIC_HOTLINE
ARG GLITCHTIP_URL=""
ARG GLITCHTIP_ORG=""
ARG GLITCHTIP_PROJECT=""
RUN --mount=type=secret,id=glitchtip_auth_token \
    if [ -s /run/secrets/glitchtip_auth_token ]; then export GLITCHTIP_AUTH_TOKEN="$(cat /run/secrets/glitchtip_auth_token)"; fi \
 && pnpm build \
 && node scripts/upload-sourcemaps.mjs \
 && find .next -name '*.map' -type f -delete \
 && rm -rf .next/cache

# Chỉ dependency production (không devDependencies). `jobs` cần cả `payload` CLI + loader TS nên không dùng standalone trace.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=tami-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
# Thư mục cache ISR/ảnh của Next phải ghi được bởi user non-root.
RUN mkdir -p /app/.next/cache && chown -R node:node /app
USER node

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
# Nguồn cần lúc chạy: `payload migrate` / `pnpm jobs` nạp TS qua loader (alias `@/` lấy từ tsconfig.json).
COPY --chown=node:node --from=builder /app/package.json /app/tsconfig.json /app/next.config.ts /app/sentry.server.config.ts ./
COPY --chown=node:node --from=builder /app/src ./src
COPY --chown=node:node --from=builder /app/scripts ./scripts
COPY --chown=node:node --from=builder /app/migrations ./migrations
# `pnpm seed` / `pnpm seed --sample` chạy được trong container (scripts/seed*.{mjs,ts} nằm trong ./scripts ở trên; seed/ chứa dữ liệu địa giới, ảnh mẫu).
COPY --chown=node:node --from=builder /app/seed ./seed

EXPOSE 3000
# Probe sâu (DB, Redis, S3): 503 khi một phụ thuộc hỏng. Service `jobs` tắt healthcheck này trong compose (không có HTTP).
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "node_modules/next/dist/bin/next", "start"]
