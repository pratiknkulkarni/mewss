# mewss

A self-hosted RSS reader. Three services and a Postgres database behind one
Nginx container: a Go daemon that fetches feeds on a schedule, a TypeScript
API that serves them, and a React client. One `docker compose up` brings the
whole thing online.

I have been running it on my homelab since February 2026 against about 30
feeds and roughly 11,000 stored articles.

