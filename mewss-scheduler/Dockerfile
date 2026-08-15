# mewss-scheduler/Dockerfile

# ── Stage 1: Build ────────────────────────────────────────────────────────────
# Build on the builder's native platform and cross-compile, rather than
# emulating the target platform through QEMU.
FROM --platform=$BUILDPLATFORM golang:1.26.2-alpine AS builder

# Provided by BuildKit; must be redeclared in-stage to be usable in RUN.
ARG TARGETOS
ARG TARGETARCH

WORKDIR /app

# Download modules first — cached unless go.mod/go.sum change
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -ldflags="-s -w" -o feedscheduler ./cmd/feedscheduler

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM gcr.io/distroless/static:nonroot

COPY --from=builder /app/feedscheduler /feedscheduler

USER nonroot:nonroot

ENTRYPOINT ["/feedscheduler"]


# # Stage 1: Build
# FROM golang:1.26.0-alpine3.23 AS builder
#
# WORKDIR /app
#
# COPY go.mod go.sum ./
# RUN go mod download
#
# COPY . .
#
# RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
#     -ldflags="-s -w" \
#     -o feedscheduler \
#     ./cmd/feedscheduler
#
# # Stage 2: Run
# FROM gcr.io/distroless/static:nonroot
#
# COPY --from=builder /app/feedscheduler /feedscheduler
#
# USER nonroot:nonroot
#
# ENTRYPOINT ["/feedscheduler"]
