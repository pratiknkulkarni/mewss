FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN bun run build

FROM nginx:1.27-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # ── Security headers ──────────────────────────────────────────────────
    add_header X-Frame-Options           "SAMEORIGIN"            always;
    add_header X-Content-Type-Options    "nosniff"               always;
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection          "1; mode=block"         always;

    # ── Gzip ─────────────────────────────────────────────────────────────
    gzip            on;
    gzip_vary       on;
    gzip_min_length 1024;
    gzip_proxied    any;
    gzip_types
        text/html
        text/css
        text/javascript
        application/javascript
        application/json
        image/svg+xml;

    # ── API proxy — forward /api/* to mewss-api ──────────────────────────
    # The upstream hostname "mewss-api" is resolved via Docker's internal
    # DNS. Port 3000 is the Hono server's internal port (not the host port).
    location /api/ {
        proxy_pass         http://mewss-api:3000;
        proxy_http_version 1.1;

        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # Required for Better Auth cookie-based sessions to work correctly
        proxy_set_header   Cookie            $http_cookie;
        proxy_pass_header  Set-Cookie;

        # Disable response buffering so streaming responses work if ever added
        proxy_buffering    off;

        # Reasonable timeouts for an RSS API
        proxy_connect_timeout 10s;
        proxy_read_timeout    30s;
        proxy_send_timeout    30s;
    }

    # ── Static assets — aggressive caching for hashed filenames ──────────
    # Vite appends a content hash to JS/CSS filenames, so they are
    # safe to cache indefinitely.
    location ~* \.(js|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp)$ {
        expires    1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # ── SPA fallback — all other routes serve index.html ─────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]