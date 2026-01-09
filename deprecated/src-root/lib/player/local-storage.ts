"use client";

/**
 * Local Audio Storage
 * Stores audio files in IndexedDB for persistence across sessions
 * Files are only accessible on the machine they were added on
 */

const DB_NAME = "passion_os_audio";
const DB_VERSION = 1;
const STORE_NAME = "audio_files";

interface StoredAudioFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: ArrayBuffer;
  addedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open/create the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Failed to open audio database:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("name", "name", { unique: false });
        store.createIndex("addedAt", "addedAt", { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Store an audio file in IndexedDB
 */
export async function storeAudioFile(
  id: string,
  file: File
): Promise<StoredAudioFile> {
  const db = await openDB();
  const data = await file.arrayBuffer();

  const storedFile: StoredAudioFile = {
    id,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    data,
    addedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(storedFile);

    request.onsuccess = () => resolve(storedFile);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get an audio file from IndexedDB and create a blob URL
 */
export async function getAudioFileUrl(id: string): Promise<string | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const storedFile = request.result as StoredAudioFile | undefined;
      if (!storedFile) {
        resolve(null);
        return;
      }

      const blob = new Blob([storedFile.data], { type: storedFile.mimeType });
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get audio file metadata (without the data)
 */
export async function getAudioFileMetadata(
  id: string
): Promise<Omit<StoredAudioFile, "data"> | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const storedFile = request.result as StoredAudioFile | undefined;
      if (!storedFile) {
        resolve(null);
        return;
      }

      // Return metadata without the large data buffer
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: _data, ...metadata } = storedFile;
      resolve(metadata);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete an audio file from IndexedDB
 */
export async function deleteAudioFile(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete multiple audio files
 */
export async function deleteAudioFiles(ids: string[]): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    let completed = 0;
    let hasError = false;

    for (const id of ids) {
      const request = store.delete(id);
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length && !hasError) {
          resolve();
        }
      };
      request.onerror = () => {
        if (!hasError) {
          hasError = true;
          reject(request.error);
        }
      };
    }

    if (ids.length === 0) {
      resolve();
    }
  });
}

/**
 * Get all stored file IDs
 */
export async function getAllAudioFileIds(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();

    request.onsuccess = () => {
      resolve(request.result as string[]);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Get total storage used (approximate)
 */
export async function getStorageUsed(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const files = request.result as StoredAudioFile[];
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      resolve(totalSize);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all stored audio files
 */
export async function clearAllAudioFiles(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

