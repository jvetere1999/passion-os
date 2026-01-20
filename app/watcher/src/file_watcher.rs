/// File system watcher for DAW projects
/// Monitors directories for file changes and triggers sync
use crate::models::{DawType, FileChange, FileChangeType};
use notify::{RecursiveMode, Watcher, RecommendedWatcher};
use std::path::{Path, PathBuf};
use std::sync::mpsc;
use std::time::Duration;
use tracing::{info, warn};
use notify::EventHandler;

/// File watcher instance
#[allow(dead_code)]
pub struct FileWatcher {
    watcher: Box<dyn Watcher>,
    rx: mpsc::Receiver<FileChange>,
}

impl FileWatcher {
    /// Creates a new file watcher for a directory
    pub fn watch_directory(path: &str, daw_type: DawType) -> Result<Self, String> {
        let (tx, rx) = mpsc::channel();

        let extensions = daw_type.extensions();
        let watch_path = PathBuf::from(path);
        let tx_clone = tx.clone();

        struct FileChangeHandler {
            tx: mpsc::Sender<FileChange>,
            extensions: Vec<String>,
        }

        impl EventHandler for FileChangeHandler {
            fn handle_event(&mut self, event: notify::Result<notify::Event>) {
                match event {
                    Ok(event) => {
                        if let Some(change) = FileWatcher::parse_event_new(&event, &self.extensions) {
                            let _ = self.tx.send(change);
                        }
                    }
                    Err(e) => warn!("Watch error: {}", e),
                }
            }
        }

        let handler = FileChangeHandler {
            tx: tx_clone,
            extensions: extensions.iter().map(|s| s.to_string()).collect(),
        };

        let mut watcher: RecommendedWatcher = RecommendedWatcher::new(handler, Default::default())
            .map_err(|e| format!("Failed to create watcher: {}", e))?;

        // Start watching
        watcher
            .watch(&watch_path, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch directory: {}", e))?;

        info!(
            "Watching directory: {} for {} files",
            path,
            extensions.join(", ")
        );

        Ok(Self {
            watcher: Box::new(watcher),
            rx,
        })
    }

    /// Receives next file change event
    pub fn next_event(&self) -> Option<FileChange> {
        self.rx.try_recv().ok()
    }

    /// Receives events with timeout
    pub fn recv_timeout(&self, timeout: Duration) -> Result<FileChange, mpsc::RecvTimeoutError> {
        self.rx.recv_timeout(timeout)
    }

    /// Filters and parses filesystem events
    fn parse_event_new(
        event: &notify::Event,
        extensions: &[String],
    ) -> Option<FileChange> {
        use notify::EventKind;

        let change_type = match event.kind {
            EventKind::Create(_) => FileChangeType::Created,
            EventKind::Modify(_) => FileChangeType::Modified,
            EventKind::Remove(_) => FileChangeType::Deleted,
            EventKind::Access(_) => return None,
            EventKind::Any => return None,
            _ => return None,
        };

        let path = event.paths.first()?.clone();

        // Filter by extension
        if let Some(ext_os) = path.extension() {
            let ext_str = format!(".{}", ext_os.to_string_lossy());
            if !extensions.contains(&ext_str) {
                return None;
            }
        } else {
            return None;
        }

        let file_size = std::fs::metadata(&path)
            .ok()
            .map(|m| m.len());

        Some(FileChange {
            path: path.to_string_lossy().to_string(),
            change_type,
            timestamp: chrono::Utc::now(),
            file_size,
        })
    }
}

/// Project directory scanner
#[allow(dead_code)]
pub struct ProjectScanner;

impl ProjectScanner {
    /// Scans directory for DAW files
    pub fn scan_for_files(
        path: &str,
        daw_type: DawType,
    ) -> Result<Vec<PathBuf>, String> {
        let root_path = Path::new(path);

        if !root_path.exists() {
            return Err(format!("Directory not found: {}", path));
        }

        let extensions = daw_type.extensions();
        let mut files = Vec::new();

        for entry in walkdir::WalkDir::new(root_path)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if let Some(ext) = entry.path().extension() {
                let ext_str = format!(".{}", ext.to_string_lossy());
                if extensions.contains(&ext_str.as_str()) {
                    files.push(entry.path().to_path_buf());
                }
            }
        }

        Ok(files)
    }

    /// Calculates total size of DAW files in directory
    pub fn calculate_total_size(
        path: &str,
        daw_type: DawType,
    ) -> Result<u64, String> {
        let files = Self::scan_for_files(path, daw_type)?;
        let total_size: u64 = files
            .iter()
            .filter_map(|f| std::fs::metadata(f).ok())
            .map(|m| m.len())
            .sum();

        Ok(total_size)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_event_creates_file() {
        let path = PathBuf::from("/tmp/test.als");
        let extensions = vec![".als"];

        let event = notify::DebouncedEvent::Create(path.clone());
        let change = FileWatcher::parse_event(event, &extensions);

        assert!(change.is_some());
        let change = change.unwrap();
        assert_eq!(change.change_type, FileChangeType::Created);
    }

    #[test]
    fn test_parse_event_ignores_wrong_extension() {
        let path = PathBuf::from("/tmp/test.txt");
        let extensions = vec![".als"];

        let event = notify::DebouncedEvent::Create(path);
        let change = FileWatcher::parse_event(event, &extensions);

        assert!(change.is_none());
    }

    #[test]
    fn test_daw_type_extensions() {
        assert_eq!(DawType::Ableton.extensions(), vec![".als"]);
        assert_eq!(DawType::FlStudio.extensions(), vec![".flp"]);
        assert_eq!(DawType::Logic.extensions(), vec![".logicx"]);
    }

    #[test]
    fn test_daw_type_watch_patterns() {
        let patterns = DawType::Ableton.watch_patterns();
        assert_eq!(patterns, vec!["**/*.als"]);
    }
}
