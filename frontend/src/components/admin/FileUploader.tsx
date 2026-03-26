'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { useToastStore } from '@/lib/store';
import { UploadResponse } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { Upload, FileText, Film, FileType, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResponse;
  error?: string;
}

interface FileUploaderProps {
  onUploadComplete?: () => void;
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'video/mp4': ['.mp4'],
  'video/x-msvideo': ['.avi'],
  'video/quicktime': ['.mov'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

const FILE_TYPE_ICONS: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="h-5 w-5 text-red-500" />,
  'video/mp4': <Film className="h-5 w-5 text-purple-500" />,
  'video/x-msvideo': <Film className="h-5 w-5 text-purple-500" />,
  'video/quicktime': <Film className="h-5 w-5 text-purple-500" />,
};

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileUploadState[] = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 500 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileState: FileUploadState, index: number) => {
    const formData = new FormData();
    formData.append('file', fileState.file);

    try {
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'uploading' as const, progress: 0 } : f
        )
      );

      const response = await api.post<UploadResponse>('/api/admin/knowledge-base/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setFiles((prev) =>
            prev.map((f, i) => (i === index ? { ...f, progress } : f))
          );
        },
      });

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, status: 'success' as const, progress: 100, result: response.data }
            : f
        )
      );
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Upload failed';
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'error' as const, error: message } : f
        )
      );
    }
  };

  const uploadAll = async () => {
    setIsUploading(true);
    const pendingFiles = files
      .map((f, i) => ({ ...f, index: i }))
      .filter((f) => f.status === 'pending');

    for (const fileData of pendingFiles) {
      await uploadFile(fileData, fileData.index);
    }

    setIsUploading(false);
    addToast('success', 'Upload complete.');
    onUploadComplete?.();
  };

  const hasPendingFiles = files.some((f) => f.status === 'pending');

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-primary-400 bg-primary-50/50'
            : 'border-border bg-muted/30 hover:border-primary-300 hover:bg-muted/50'
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            'h-8 w-8 mx-auto mb-3',
            isDragActive ? 'text-primary-500' : 'text-muted-foreground'
          )}
        />
        <p className="text-sm font-medium text-foreground mb-1">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports PDF, PPTX, MP4, AVI, MOV, TXT, MD (max 500MB)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileState, index) => (
            <div
              key={`${fileState.file.name}-${index}`}
              className="flex items-center gap-3 bg-card border rounded-xl px-4 py-3"
            >
              {FILE_TYPE_ICONS[fileState.file.type] || (
                <FileType className="h-5 w-5 text-muted-foreground" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {fileState.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                {fileState.status === 'uploading' && (
                  <div className="mt-1.5">
                    <Progress value={fileState.progress} />
                  </div>
                )}
                {fileState.status === 'success' && fileState.result && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {fileState.result.chunks_created} chunks created
                  </p>
                )}
                {fileState.status === 'error' && (
                  <p className="text-xs text-destructive mt-1">{fileState.error}</p>
                )}
              </div>

              {fileState.status === 'uploading' && (
                <Loader2 className="h-5 w-5 text-primary-700 animate-spin shrink-0" />
              )}
              {fileState.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              )}
              {fileState.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              )}
              {fileState.status === 'pending' && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {hasPendingFiles && (
        <Button
          variant="primary"
          onClick={uploadAll}
          isLoading={isUploading}
          icon={<Upload className="h-4 w-4" />}
        >
          Upload {files.filter((f) => f.status === 'pending').length} file(s)
        </Button>
      )}
    </div>
  );
}
