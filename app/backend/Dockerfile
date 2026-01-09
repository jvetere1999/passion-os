# Build stage
FROM rust:1.85-slim-bookworm AS builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests and source
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY migrations ./migrations

# Build release binary with reduced parallelism to avoid OOM
ENV CARGO_BUILD_JOBS=2
RUN cargo build --release --package ignition-api

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/ignition-api /app/ignition-api

# Create non-root user
RUN useradd -r -s /bin/false ignition
USER ignition

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the binary
CMD ["/app/ignition-api"]

