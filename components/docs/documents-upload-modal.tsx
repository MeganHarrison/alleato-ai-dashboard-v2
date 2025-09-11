"use client";

import { useState, useEffect } from "react";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/dropzone";
import { useSupabaseUpload } from "@/hooks/use-supabase-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

export function DocumentsUploadModal({ onUpload }: { onUpload?: () => void }) {
  const [open] = useState(false);
  const [title] = useState(false);
  const [category] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading] = useState(false);
  // Dropzone + Supabase hook
  const props = useSupabaseUpload({
    bucketName: "documents",
    path: "uploads",
    allowedMimeTypes: ["application/pdf", "image/*"],
    maxFiles: 1,
    maxFileSize: 10 * 1000 * 1000,
  });

  // Then use useEffect to handle errors/success:
  useEffect(() => {
    if (props.errors.length > 0) {
      setIsUploading(false);
      setError(props.errors.map(e => e.message).join(", "));
    }
    if (props.isSuccess) {
      setIsUploading(false);
      setOpen(false);
      setTitle("");
      setCategory("");
      setError(null);
      if (onUpload) onUpload();
    }
  }, [props.errors, props.isSuccess]);

  const canSubmit =
    !!props.files?.length &&
    title.trim().length > 0 &&
    category.trim().length > 0 &&
    !isUploading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add Document</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Upload New Document</DialogTitle>
        <div className="space-y-4">
          <label className="block text-sm font-medium">
            Title
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter a document title"
              disabled={isUploading}
            />
          </label>
          <label className="block text-sm font-medium">
            Category
            <select
              className="mt-1 w-full border rounded px-3 py-2"
              value={category}
              onChange={e => setCategory(e.target.value)}
              disabled={isUploading}
            >
              <option value="">Select a category</option>
              <option value="general">General</option>
              <option value="finance">Finance</option>
              <option value="legal">Legal</option>
              <option value="marketing">Marketing</option>
            </select>
          </label>
          <Dropzone {...props}>
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>
          {error && <div className="text-red-500">{error}</div>}
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              // Optionally pass title/category as metadata, or save in your DB via an API!
              props.onUpload();
            }}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
