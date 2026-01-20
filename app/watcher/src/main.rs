// Tauri DAW File Watcher
// Automatically detects and encrypts DAW project files for cloud backup
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod api;
mod crypto;
mod file_watcher;
mod models;
mod services;
mod ui;

use tauri::{Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};
use tracing::info;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into()),
        )
        .init();

    info!("Starting DAW Watcher...");

    // System tray menu
    let tray_menu = SystemTrayMenu::new()
        .add_item(tauri::CustomMenuItem::new("open".to_string(), "Open Watcher"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::CustomMenuItem::new("status".to_string(), "Sync Status"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::CustomMenuItem::new("settings".to_string(), "Settings"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(tauri::CustomMenuItem::new("quit".to_string(), "Quit"));

    let tray = SystemTray::new().with_menu(tray_menu);

    // Initialize persistent state
    let watcher_state = match ui::commands::WatcherState::new() {
        Ok(state) => state,
        Err(e) => {
            eprintln!("Failed to initialize watcher state: {}", e);
            std::process::exit(1);
        }
    };

    tauri::Builder::default()
        .manage(watcher_state)
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                let window = app.get_window("main");
                match id.as_str() {
                    "open" => {
                        if let Some(w) = window {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                }
            }
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main");
                if let Some(w) = window {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            ui::commands::get_watched_projects,
            ui::commands::add_watch_directory,
            ui::commands::remove_watch_directory,
            ui::commands::get_sync_status,
            ui::commands::trigger_sync,
            ui::commands::get_settings,
            ui::commands::update_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
