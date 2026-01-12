'use client';

import { useState } from 'react';
import { useErrorStore } from '@/lib/stores/error-store';
import { apiPost } from '@/lib/api/client';

interface FocusTrackUploadProps {
  libraryId: string;
  onTrackAdded: () => void;
}

export function FocusTrackUpload({ libraryId, onTrackAdded }: FocusTrackUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const { showError, showSuccess } = useErrorStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const fileInput = (e.target as HTMLFormElement).querySelector('input[type="file"]') as HTMLInputElement;
    const titleInput = (e.target as HTMLFormElement).querySelector('input[name="title"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    const title = titleInput?.value || fileName;

    if (!file) {
      showError('Please select a file to upload');
      return;
    }

    if (!title) {
      showError('Please enter a track title');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned upload URL from backend
      const uploadUrlResponse = await apiPost(
        `/api/focus/libraries/${libraryId}/tracks/upload-url`,
        {
          filename: file.name,
          mime_type: file.type || 'audio/mpeg',
        }
      );

      if (!uploadUrlResponse?.url) {
        throw new Error('Failed to get upload URL');
      }

      const { url, key } = uploadUrlResponse;
      setProgress(30);

      // Step 2: Upload file directly to R2 using presigned URL
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'audio/mpeg',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      setProgress(70);

      // Step 3: Record track in database
      await apiPost(
        `/api/focus/libraries/${libraryId}/tracks`,
        {
          track_title: title,
          track_url: null, // URL will be empty since we use R2 presigned URL
          r2_key: key, // Store the R2 key for later retrieval
          duration_seconds: null,
        }
      );

      setProgress(100);
      showSuccess(`Track "${title}" uploaded successfully`);
      
      // Reset form
      setFileName('');
      titleInput.value = '';
      fileInput.value = '';
      setProgress(0);
      
      // Notify parent to refresh tracks list
      onTrackAdded();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      showError(message);
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div>
        <label className="block text-sm font-medium mb-2">Track Title</label>
        <input
          type="text"
          name="title"
          placeholder={fileName || 'Enter track title'}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isUploading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Audio File</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="w-full"
        />
        {fileName && <p className="text-sm text-gray-600 mt-1">{fileName}</p>}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progress}% uploaded</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isUploading || !fileName}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Upload Track'}
      </button>
    </form>
  );
}
