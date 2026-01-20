/// Cryptography module for DAW file encryption
/// Uses AES-256-GCM for authenticated encryption matching backend standards
use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce,
};
use rand::Rng;
use sha2::{Digest, Sha256};

/// Encryption configuration
#[allow(dead_code)]
pub struct EncryptionConfig {
    /// Master encryption key (256 bits)
    key: [u8; 32],
}

impl EncryptionConfig {
    /// Creates encryption config from raw key bytes
    pub fn new(key: &[u8; 32]) -> Self {
        Self { key: *key }
    }

    /// Derives key from password using PBKDF2
    pub fn from_password(password: &str, salt: &[u8; 16]) -> Self {
        // TODO: Implement PBKDF2 derivation
        // For now, just hash the password
        let mut hasher = Sha256::new();
        hasher.update(password.as_bytes());
        hasher.update(salt);
        let hash = hasher.finalize();

        let mut key = [0u8; 32];
        key.copy_from_slice(&hash[..32]);

        Self { key }
    }

    /// Generates random key material
    pub fn random() -> Self {
        let mut rng = rand::thread_rng();
        let mut key = [0u8; 32];
        rng.fill(&mut key);

        Self { key }
    }
}

/// Encrypted data container
#[derive(Debug, Clone)]
pub struct EncryptedData {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
    pub aad: Option<Vec<u8>>,
}

/// Encrypts file data using AES-256-GCM
pub fn encrypt_data(
    config: &EncryptionConfig,
    plaintext: &[u8],
    aad: Option<&[u8]>,
) -> Result<EncryptedData, String> {
    // Generate random nonce (96 bits for GCM)
    let mut rng = rand::thread_rng();
    let mut nonce_bytes = [0u8; 12];
    rng.fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Create cipher
    let cipher = Aes256Gcm::new_from_slice(&config.key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Encrypt with optional AAD
    let payload = match aad {
        Some(aad_data) => Payload {
            msg: plaintext,
            aad: aad_data,
        },
        None => Payload {
            msg: plaintext,
            aad: b"",
        },
    };

    let ciphertext = cipher
        .encrypt(nonce, payload)
        .map_err(|e| format!("Encryption failed: {}", e))?;

    Ok(EncryptedData {
        ciphertext,
        nonce: nonce_bytes.to_vec(),
        aad: aad.map(|a| a.to_vec()),
    })
}

/// Decrypts file data using AES-256-GCM
pub fn decrypt_data(
    config: &EncryptionConfig,
    encrypted: &EncryptedData,
) -> Result<Vec<u8>, String> {
    // Recreate nonce
    if encrypted.nonce.len() != 12 {
        return Err("Invalid nonce length".to_string());
    }
    let nonce = Nonce::from_slice(&encrypted.nonce);

    // Create cipher
    let cipher = Aes256Gcm::new_from_slice(&config.key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Decrypt with optional AAD
    let payload = match &encrypted.aad {
        Some(aad_data) => Payload {
            msg: &encrypted.ciphertext,
            aad: aad_data,
        },
        None => Payload {
            msg: &encrypted.ciphertext,
            aad: b"",
        },
    };

    cipher
        .decrypt(nonce, payload)
        .map_err(|e| format!("Decryption failed: {}", e))
}

/// Calculates SHA256 hash of file
pub fn hash_file_data(data: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data);
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let config = EncryptionConfig::random();
        let plaintext = b"Hello, DAW World!";

        let encrypted = encrypt_data(&config, plaintext, None).expect("Encryption failed");
        let decrypted = decrypt_data(&config, &encrypted).expect("Decryption failed");

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_encrypt_with_aad() {
        let config = EncryptionConfig::random();
        let plaintext = b"Secret data";
        let aad = b"additional data";

        let encrypted = encrypt_data(&config, plaintext, Some(aad)).expect("Encryption failed");
        let decrypted = decrypt_data(&config, &encrypted).expect("Decryption failed");

        assert_eq!(plaintext, decrypted.as_slice());
    }

    #[test]
    fn test_different_keys_cannot_decrypt() {
        let config1 = EncryptionConfig::random();
        let config2 = EncryptionConfig::random();
        let plaintext = b"Secret data";

        let encrypted = encrypt_data(&config1, plaintext, None).expect("Encryption failed");
        let result = decrypt_data(&config2, &encrypted);

        assert!(result.is_err());
    }

    #[test]
    fn test_hash_file_data() {
        let data = b"test data";
        let hash = hash_file_data(data);
        assert_eq!(hash.len(), 64); // SHA256 hex is 64 chars
    }
}
