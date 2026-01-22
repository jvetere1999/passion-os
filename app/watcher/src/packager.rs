use std::path::Path;
use tar::Builder;

pub fn build_tar_archive(root: &Path) -> Result<Vec<u8>, String> {
    let mut buffer = Vec::new();
    {
        let mut builder = Builder::new(&mut buffer);
        builder
            .append_dir_all(".", root)
            .map_err(|e| format!("Failed to add directory to archive: {}", e))?;
        builder
            .finish()
            .map_err(|e| format!("Failed to finalize archive: {}", e))?;
        // Explicitly drop builder to release the borrow on buffer
        drop(builder);
    }
    Ok(buffer)
}
