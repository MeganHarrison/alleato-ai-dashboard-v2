// RAG System Upload Page

"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  documentId?: string;
  error?: string;
}

export default function RagSystemUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading] = useState(false);
  const [tags, setTags] = useState<string>("");
  const [category, setCategory] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      status: "pending" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md", ".markdown"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const uploadFile = async (fileData: UploadedFile, index: number) => {
    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, status: "uploading", progress: 30 } : f
      )
    );

    const formData = new FormData();
    formData.append("file", fileData.file);

    const metadata = {
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      category: category || undefined,
    };
    formData.append("metadata", JSON.stringify(metadata));

    try {
      const response = await fetch("/api/rag/documents/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Upload failed");
      }

      // Update status to processing
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "processing",
                progress: 60,
                documentId: result.document.id,
              }
            : f
        )
      );

      // Start vectorization
      const vectorResponse = await fetch(
        `/api/rag/vectorize/${result.document.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chunk_size: 1000,
            chunk_overlap: 200,
          }),
        }
      );

      if (!vectorResponse.ok) {
        throw new Error("Failed to start vectorization");
      }

      const vectorResult = await vectorResponse.json();

      // Poll for completion
      await pollVectorizationStatus(vectorResult.job_id, index);
    } catch (error) {
      console.error("Upload error:", error);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? {
                ...f,
                status: "failed",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f
        )
      );
      toast.error(`Failed to upload ${fileData.file.name}`);
    }
  };

  const pollVectorizationStatus = async (jobId: string, fileIndex: number) => {
    const maxAttempts = 60; // 60 seconds timeout
    const attempts = 0;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rag/vectorize/status/${jobId}`);
        const status = await response.json();

        setFiles((prev) =>
          prev.map((f, i) =>
            i === fileIndex
              ? {
                  ...f,
                  progress: 60 + status.progress * 0.4,
                }
              : f
          )
        );

        if (status.status === "completed") {
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f, i) =>
              i === fileIndex
                ? {
                    ...f,
                    status: "completed",
                    progress: 100,
                  }
                : f
            )
          );
          toast.success(`Successfully processed ${files[fileIndex].file.name}`);
        } else if (status.status === "failed" || attempts >= maxAttempts) {
          clearInterval(interval);
          setFiles((prev) =>
            prev.map((f, i) =>
              i === fileIndex
                ? {
                    ...f,
                    status: "failed",
                    error: status.error || "Processing timeout",
                  }
                : f
            )
          );
          toast.error(`Failed to process ${files[fileIndex].file.name}`);
        }

        attempts++;
      } catch (error) {
        clearInterval(interval);
        console.error("Polling error:", error);
      }
    }, 1000);
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    for (const i = 0; i < files.length; i++) {
      if (files[i].status === "pending") {
        await uploadFile(files[i], i);
      }
    }

    setIsUploading(false);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "completed"));
  };

  return (
    <div className="px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload documents to add them to your RAG knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="ai, documentation, research"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="Technical Documentation"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-lg font-medium">Drop the files here...</p>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supported formats: PDF, TXT, MD, DOCX (max 50MB)
                </p>
              </>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files ({files.length})</h3>
                <div className="space-x-2">
                  {files.some((f) => f.status === "completed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompleted}
                    >
                      Clear Completed
                    </Button>
                  )}
                  <Button
                    onClick={uploadAllFiles}
                    disabled={
                      isUploading || !files.some((f) => f.status === "pending")
                    }
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Upload All"
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {file.file.name}
                        </p>
                        <Badge
                          variant={
                            file.status === "completed"
                              ? "default"
                              : file.status === "failed"
                              ? "destructive"
                              : file.status === "uploading" ||
                                file.status === "processing"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {file.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {(file.status === "uploading" ||
                        file.status === "processing") && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                      {file.error && (
                        <p className="text-xs text-destructive mt-1">
                          {file.error}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={
                        file.status === "uploading" ||
                        file.status === "processing"
                      }
                    >
                      {file.status === "completed" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : file.status === "failed" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
