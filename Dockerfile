# ---------- build stage ----------
FROM node:22-alpine AS build
WORKDIR /app

# Vite inlines these into the JS bundle at BUILD time — pass with --build-arg.
# The anon key is safe to embed: it is public by design; RLS is the security boundary.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Install deps first for layer caching; pnpm-workspace.yaml carries the
# allowBuilds approval that lets esbuild run its postinstall.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN test -n "$VITE_SUPABASE_URL" || (echo "ERROR: VITE_SUPABASE_URL build arg is required" && exit 1)
RUN pnpm build

# ---------- runtime stage ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
