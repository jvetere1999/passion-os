//! Ignition API Server
//!
//! Rust backend monolith for the Ignition application.
//! Handles all business logic, authentication, and data access.

use std::net::SocketAddr;
use std::sync::Arc;

use axum::Router;
use tower_http::request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod error;
mod middleware;
mod routes;
mod services;
mod shared;
mod state;
mod storage;

#[cfg(test)]
mod tests;

use config::AppConfig;
use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables from .env
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "ignition_api=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Load configuration
    let config = AppConfig::load()?;
    tracing::info!("Configuration loaded");

    // Create application state
    let state = AppState::new(&config).await?;
    let state = Arc::new(state);

    // Build the router
    let app = build_router(state);

    // Start the server
    let addr: SocketAddr = format!("{}:{}", config.server.host, config.server.port)
        .parse()
        .expect("Invalid server address");

    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn build_router(state: Arc<AppState>) -> Router {
    // Create base router with state type
    let app: Router<Arc<AppState>> = Router::new()
        // Health check (no auth required)
        .merge(routes::health::router())
        // Auth routes (needs session extraction for /session endpoint, but no CSRF)
        .nest(
            "/auth",
            routes::auth::router().layer(axum::middleware::from_fn_with_state(
                state.clone(),
                middleware::auth::extract_session,
            )),
        )
        // API routes (requires auth + CSRF)
        .nest(
            "/api",
            routes::api::router()
                .layer(axum::middleware::from_fn(middleware::csrf::csrf_check))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    middleware::auth::extract_session,
                )),
        )
        // Reference tracks routes (requires auth + CSRF)
        .nest(
            "/reference",
            routes::reference::router()
                .layer(axum::middleware::from_fn(middleware::csrf::csrf_check))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    middleware::auth::extract_session,
                )),
        )
        // Frames routes (requires auth, GET only so no CSRF needed)
        .nest(
            "/frames",
            routes::frames::router().layer(axum::middleware::from_fn_with_state(
                state.clone(),
                middleware::auth::extract_session,
            )),
        )
        // Blob storage routes (requires auth + CSRF)
        .nest(
            "/blobs",
            routes::blobs::router()
                .layer(axum::middleware::from_fn(middleware::csrf::csrf_check))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    middleware::auth::extract_session,
                )),
        )
        // Admin routes (requires admin role + auth + CSRF)
        .nest(
            "/admin",
            routes::admin::router()
                .layer(axum::middleware::from_fn(middleware::auth::require_admin))
                .layer(axum::middleware::from_fn(middleware::csrf::csrf_check))
                .layer(axum::middleware::from_fn_with_state(
                    state.clone(),
                    middleware::auth::extract_session,
                )),
        );

    // Apply state and middleware
    app.with_state(state.clone())
        .layer(middleware::cors::cors_layer(&state.config))
        .layer(TraceLayer::new_for_http())
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(SetRequestIdLayer::x_request_id(MakeRequestUuid))
}
