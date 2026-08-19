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
# create rate limiting zone named auth with the below configuration
# zone has 10MB of shared space
# TODO: I need to if the binary_remote_addr correctly identifies the IPs if I'm behind caddy
# They might share IPs if that's the case
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

server {
    listen 80; # listen on port 80
    server_name _; # match any hostname

    root /usr/share/nginx/html; # root of the application, where I copied the dist 9 lines above
    index index.html; # root file to serve

    # ── Security headers ──────────────────────────────────────────────────
    # prevent this site from being embedded in an iframe
    # SAMEORIGIN here apparently means allowed on my site; but I don't think I really require it?
    add_header X-Frame-Options           "SAMEORIGIN"            always;

    # stop browser from guessing filetypes incorrectly; apparently helps with XSS
    add_header X-Content-Type-Options    "nosniff"               always;

    # controls how much referrer information gets sent to other sites
    # Since users are clicking on articles to view in source, maybe I should add something?
    add_header Referrer-Policy           "strict-origin-when-cross-origin" always;

    # used for "old browsers"
    add_header X-XSS-Protection          "1; mode=block"         always;

    # if I ever move the API to another website
    # I may need to remove 'connect-src' since it only allows 'fetch' calls to same origin
    # Has to stay on one line. Nginx copies the value through verbatim, so a
    # multi-line string puts bare LF bytes inside the header value, which is not
    # a legal HTTP field. Busybox wget rejects the whole response with
    # "bad header line", which is enough to fail the HEALTHCHECK below forever.
    #
    # Directive by directive: only same-origin by default; no inline scripts;
    # inline styles allowed because the bundler injects them; images may also
    # come from data: URIs and any https host, since article thumbnails are
    # remote; fetch/XHR restricted to this origin, which is why the client and
    # the API share one; no plugins; and not embeddable in a frame anywhere.
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'" always;

    # I am not too sure I should be including this here consider I am usually behind Caddy https
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # hide Nginx version from error pages
    server_tokens off;

    # max upload capped to 10MB
    client_max_body_size 10m;

    # ── Gzip ─────────────────────────────────────────────────────────────
    gzip            on;
    gzip_vary       on;
    gzip_min_length 1024;
    gzip_proxied    any;
    gzip_types
        text/css
        text/javascript
        application/javascript
        application/json
        image/svg+xml;

    # Set proxy headers at the server level so BOTH location blocks inherit them
    proxy_set_header   Host              $host;

    # sends the client IP to the server. Useful for existing connections on Settings page.
    proxy_set_header   X-Real-IP         $remote_addr;

    # preserves the full IP chain
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;

    # original request was http or https - sent to backend
    proxy_set_header   X-Forwarded-Proto $scheme;

    # cookie forwarded to backend
    proxy_set_header   Cookie            $http_cookie;

    # allows backend to "Set Cookie"
    proxy_pass_header  Set-Cookie;

    # timeouts
    proxy_connect_timeout 10s;
    proxy_read_timeout    30s;
    proxy_send_timeout    30s;

    # ── Rate-limited Auth proxy ──────────────────────────────────────────
    # handles the /auth/* requests for better-auth with a rate limit
    location /api/auth/ {
        # apply the actual limiter named auth defined above
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://mewss-api:3000;
        proxy_http_version 1.1;
    }

    # ── Standard API proxy ───────────────────────────────────────────────
    # handles the other requests without a rate limit
    location /api/ {
        proxy_pass http://mewss-api:3000;
        proxy_http_version 1.1;
    }

    # ── Static assets ────────────────────────────────────────────────────
    # cache the file types mentioned below for 1 year
    location ~* \.(js|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp)$ {
        expires    1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    # ── SPA fallback ─────────────────────────────────────────────────────
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]