// @ts-nocheck
"use client";

import { useState } from "react";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createDocument } from "@/app/actions/documents-full-actions";
import { toast } from "sonner";

export function AddDocumentButton() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: "",
    document_type: "text",
    metadata: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let metadata = null;
      if (formData.metadata) {
        try {
          metadata = JSON.parse(formData.metadata);
        } catch {
          toast.error("Invalid JSON in metadata field");
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await createDocument({
        content: formData.content || null,
        document_type: formData.document_type || null,
        metadata,
      });

      if (error) {
        toast.error(`Failed to create document: ${error}`);
      } else {
        toast.success("Document created successfully");
        setOpen(false);
        setFormData({
          content: "",
          document_type: "text",
          metadata: "",
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error creating document:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
          <DialogDescription>
            Create a new document entry in the database.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={formData.document_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, document_type: value })
                }
              >
                <SelectTrigger id="document_type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Enter document content..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="min-h-[150px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="metadata">
                Metadata (JSON)
                <span className="text-xs text-muted-foreground ml-2">Optional</span>
              </Label>
              <Textarea
                id="metadata"
                placeholder='{"key": "value"}'
                value={formData.metadata}
                onChange={(e) =>
                  setFormData({ ...formData, metadata: e.target.value })
                }
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}