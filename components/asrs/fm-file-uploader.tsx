"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileJson, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface UploadResult {
  success: boolean;
  message: string;
  table_info?: {
    table_number: number;
    title: string;
    asrs_type: string;
    system_type: string;
    embedding_dimensions: number;
  };
}

export function FMFileUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [progress] = useState(false);
  const [dragActive] = useState(false);
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        file => file.type === 'application/json' || file.name.endsWith('.json')
      );
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);
    setProgress(0);

    const uploadResults: UploadResult[] = [];
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'https://fm-global-vectorizer.workers.dev';

    for (const i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${workerUrl}/api/upload-json`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        
        if (response.ok) {
          uploadResults.push({
            success: true,
            message: `${file.name}: Successfully vectorized with ${result.table_info?.embedding_dimensions || 1536} dimensions`,
            table_info: result.table_info,
          });
        } else {
          uploadResults.push({
            success: false,
            message: `${file.name}: ${result.error || 'Upload failed'}`,
          });
        }
      } catch (error: unknown) {
        uploadResults.push({
          success: false,
          message: `${file.name}: ${error.message}`,
        });
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setResults(uploadResults);
    setUploading(false);
    setFiles([]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>FM Global Table Vectorizer</CardTitle>
        <CardDescription>
          Upload JSON files to vectorize FM Global tables with OpenAI embeddings (1536 dimensions)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Drag and drop JSON files here, or click to select
          </p>
          <input
            type="file"
            multiple
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span>Select Files</span>
            </Button>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileJson className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={uploadFiles} 
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Vectorizing Files...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload and Vectorize ({files.length} files)
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-gray-600 text-center">
              Processing... {Math.round(progress)}%
            </p>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Upload Results</h3>
            <div className="space-y-1">
              {results.map((result, index) => (
                <Alert key={index} variant={result.success ? "default" : "destructive"}>
                  <div className="flex items-start space-x-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    )}
                    <AlertDescription className="text-sm">
                      {result.message}
                      {result.table_info && (
                        <div className="mt-1 text-xs text-gray-600">
                          Table {result.table_info.table_number} | 
                          Type: {result.table_info.asrs_type} | 
                          System: {result.table_info.system_type}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Successfully vectorized: {results.filter(r => r.success).length}/{results.length}
            </div>
          </div>
        )}

        {/* Info Alert */}
        <Alert>
          <AlertDescription>
            All files are processed with OpenAI's text-embedding-3-small model, generating 
            1536-dimension vectors for semantic search. Data is stored in Supabase with 
            pgvector for efficient similarity search.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}