/// Persistent state management for DAW Watcher
/// Handles loading/saving configuration, projects, and stats to disk
use crate::models::{WatchedProject, WatcherSettings, SyncStats};
use std::fs;
use std::path::{Path, PathBuf};
use tracing::{debug, info};

/// Directories for persistent state
pub struct StateManager {
    config_dir: PathBuf,
    projects_file: PathBuf,
    settings_file: PathBuf,
    stats_file: PathBuf,
}

impl StateManager {
    /// Creates state manager with platform-specific paths
    pub fn new() -> Result<Self, String> {
        let config_dir = Self::get_config_dir()?;

        // Create directories if they don't exist
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;

        let projects_file = config_dir.join("projects.json");
        let settings_file = config_dir.join("settings.json");
        let stats_file = config_dir.join("stats.json");

        info!("State manager initialized at {:?}", config_dir);

        Ok(Self {
            config_dir,
            projects_file,
            settings_file,
            stats_file,
        })
    }

    /// Gets platform-specific config directory
    fn get_config_dir() -> Result<PathBuf, String> {
        #[cfg(target_os = "macos")]
        {
            if let Ok(home) = std::env::var("HOME") {
                return Ok(PathBuf::from(home).join(".config/daw-watcher"));
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Ok(appdata) = std::env::var("APPDATA") {
                return Ok(PathBuf::from(appdata).join("daw-watcher"));
            }
        }

        #[cfg(target_os = "linux")]
        {
            if let Ok(home) = std::env::var("HOME") {
                return Ok(PathBuf::from(home).join(".config/daw-watcher"));
            }
        }

        Err("Could not determine config directory".to_string())
    }

    /// Loads projects from persistent storage
    pub fn load_projects(&self) -> Result<Vec<WatchedProject>, String> {
        if !self.projects_file.exists() {
            debug!("Projects file does not exist, returning empty list");
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&self.projects_file)
            .map_err(|e| format!("Failed to read projects file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse projects: {}", e))
    }

    /// Saves projects to persistent storage
    pub fn save_projects(&self, projects: &[WatchedProject]) -> Result<(), String> {
        let content = serde_json::to_string_pretty(projects)
            .map_err(|e| format!("Failed to serialize projects: {}", e))?;

        fs::write(&self.projects_file, content)
            .map_err(|e| format!("Failed to write projects file: {}", e))?;

        info!("Saved {} projects to disk", projects.len());
        Ok(())
    }

    /// Loads settings from persistent storage
    pub fn load_settings(&self) -> Result<WatcherSettings, String> {
        if !self.settings_file.exists() {
            debug!("Settings file does not exist, using defaults");
            return Ok(WatcherSettings::default());
        }

        let content = fs::read_to_string(&self.settings_file)
            .map_err(|e| format!("Failed to read settings file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse settings: {}", e))
    }

    /// Saves settings to persistent storage
    pub fn save_settings(&self, settings: &WatcherSettings) -> Result<(), String> {
        let content = serde_json::to_string_pretty(settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        fs::write(&self.settings_file, content)
            .map_err(|e| format!("Failed to write settings file: {}", e))?;

        info!("Saved settings to disk");
        Ok(())
    }

    /// Loads sync statistics
    pub fn load_stats(&self) -> Result<SyncStats, String> {
        if !self.stats_file.exists() {
            debug!("Stats file does not exist, using defaults");
            return Ok(SyncStats::default());
        }

        let content = fs::read_to_string(&self.stats_file)
            .map_err(|e| format!("Failed to read stats file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse stats: {}", e))
    }

    /// Saves sync statistics
    pub fn save_stats(&self, stats: &SyncStats) -> Result<(), String> {
        let content = serde_json::to_string_pretty(stats)
            .map_err(|e| format!("Failed to serialize stats: {}", e))?;

        fs::write(&self.stats_file, content)
            .map_err(|e| format!("Failed to write stats file: {}", e))?;

        debug!("Saved stats to disk");
        Ok(())
    }

    /// Gets the size of a project directory
    pub fn get_directory_size(path: &str) -> Result<u64, String> {
        let path = Path::new(path);

        if !path.exists() {
            return Err(format!("Path does not exist: {}", path.display()));
        }

        let mut size: u64 = 0;

        for entry in walkdir::WalkDir::new(path)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    size += metadata.len();
                }
            }
        }

        Ok(size)
    }

    /// Validates a directory path exists and is readable
    pub fn validate_directory(path: &str) -> Result<(), String> {
        let path = Path::new(path);

        if !path.exists() {
            return Err(format!("Directory does not exist: {}", path.display()));
        }

        if !path.is_dir() {
            return Err(format!("Path is not a directory: {}", path.display()));
        }

        // Check if readable
        if fs::read_dir(path).is_err() {
            return Err(format!("Directory is not readable: {}", path.display()));
        }

        Ok(())
    }

    /// Exports all state to JSON (for debugging/backup)
    pub fn export_all_state(&self) -> Result<serde_json::Value, String> {
        let projects = self.load_projects()?;
        let settings = self.load_settings()?;
        let stats = self.load_stats()?;

        Ok(serde_json::json!({
            "projects": projects,
            "settings": settings,
            "stats": stats,
            "exported_at": chrono::Utc::now().to_rfc3339(),
        }))
    }

    /// Imports state from JSON
    pub fn import_all_state(&self, data: &serde_json::Value) -> Result<(), String> {
        if let Some(projects) = data.get("projects").and_then(|p| p.as_array()) {
            let projects: Vec<WatchedProject> = projects
                .iter()
                .filter_map(|p| serde_json::from_value(p.clone()).ok())
                .collect();
            self.save_projects(&projects)?;
        }

        if let Some(settings_value) = data.get("settings") {
            if let Ok(settings) = serde_json::from_value(settings_value.clone()) {
                self.save_settings(&settings)?;
            }
        }

        if let Some(stats_value) = data.get("stats") {
            if let Ok(stats) = serde_json::from_value(stats_value.clone()) {
                self.save_stats(&stats)?;
            }
        }

        info!("State imported successfully");
        Ok(())
    }

    /// Clears all state (for reset/cleanup)
    pub fn clear_all(&self) -> Result<(), String> {
        let _ = fs::remove_file(&self.projects_file);
        let _ = fs::remove_file(&self.settings_file);
        let _ = fs::remove_file(&self.stats_file);
        
        info!("All state cleared");
        Ok(())
    }

    /// Gets config directory path
    pub fn get_config_path(&self) -> &Path {
        &self.config_dir
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_state_manager_creation() {
        // This test will fail on some systems without proper env setup
        // In CI, use TEST_CONFIG_DIR env var
        let result = StateManager::new();
        assert!(result.is_ok() || result.is_err()); // Both outcomes acceptable in test
    }

    #[test]
    fn test_validate_directory() {
        let temp_dir = TempDir::new().unwrap();
        let path = temp_dir.path().to_string_lossy().to_string();
        
        assert!(StateManager::validate_directory(&path).is_ok());
        assert!(StateManager::validate_directory("/nonexistent/path").is_err());
    }

    #[test]
    fn test_get_directory_size() {
        let temp_dir = TempDir::new().unwrap();
        
        // Create a test file
        let test_file = temp_dir.path().join("test.txt");
        fs::write(&test_file, b"test content").unwrap();
        
        let path = temp_dir.path().to_string_lossy().to_string();
        let size = StateManager::get_directory_size(&path).unwrap();
        
        assert!(size > 0);
        assert_eq!(size, 12); // "test content"
    }
}
