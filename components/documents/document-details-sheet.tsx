"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  FileText, 
  Download,
  User,
  Hash,
  Folder,
  Clock,
  Edit,
  Save,
  X
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { updateDocument } from "@/app/actions/documents-full-actions"
import { toast } from "sonner"

interface Document {
  id: number;
  content: string | null;
  document_type: string | null;
  embedding: string | null;
  metadata: any | null;
  title?: string | null;
  project?: string | null;
  date?: string | null;
  category?: string | null;
  summary?: string | null;
}

interface DocumentDetailsSheetProps {
  document: Document
  trigger: React.ReactNode
}

// Helper functions (same as in the table)
const extractTitle = (doc: Document): string => {
  if (doc.metadata?.title) return doc.metadata.title;
  if (doc.metadata?.file_path) {
    const parts = doc.metadata.file_path.split('/');
    return parts[parts.length - 1].replace(/\.[^/.]+$/, '');
  }
  if (doc.content) {
    const firstLine = doc.content.split('\n')[0];
    return firstLine.substring(0, 100);
  }
  return 'Untitled Document';
};

const extractProject = (doc: Document): string => {
  if (doc.metadata?.project) return doc.metadata.project;
  if (doc.metadata?.project_name) return doc.metadata.project_name;
  return '';
};

const extractDate = (doc: Document): string => {
  if (doc.metadata?.date) return doc.metadata.date;
  if (doc.metadata?.created_at) return doc.metadata.created_at;
  if (doc.metadata?.updated_at) return doc.metadata.updated_at;
  return '';
};

const extractCategory = (doc: Document): string => {
  if (doc.metadata?.category) return doc.metadata.category;
  if (doc.document_type) return doc.document_type;
  return 'General';
};

const extractSummary = (doc: Document): string => {
  if (doc.metadata?.summary) return doc.metadata.summary;
  if (doc.metadata?.description) return doc.metadata.description;
  if (doc.content) {
    return doc.content.substring(0, 500);
  }
  return '';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'Not specified';
  try {
    const date = new Date(dateStr);
    return format(date, 'PPpp');
  } catch {
    return dateStr;
  }
};

export function DocumentDetailsSheet({ document, trigger }: DocumentDetailsSheetProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedDoc, setEditedDoc] = React.useState(document)
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updates = {
        content: editedDoc.content,
        document_type: editedDoc.document_type,
        metadata: {
          ...editedDoc.metadata,
          title: editedDoc.title,
          project: editedDoc.project,
          category: editedDoc.category,
          summary: editedDoc.summary,
          date: editedDoc.date,
        }
      }

      const { error } = await updateDocument(document.id, updates)
      
      if (error) {
        toast.error(`Failed to update document: ${error}`)
      } else {
        toast.success("Document updated successfully")
        setIsEditing(false)
      }
    } catch (error) {
      toast.error("An error occurred while updating the document")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedDoc(document)
    setIsEditing(false)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-[600px] sm:w-[700px] p-0">
        <SheetHeader className="px-6 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">
                {extractTitle(document)}
              </SheetTitle>
              <SheetDescription>
                Document ID: #{document.id}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-6 space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Title
                    </Label>
                    {isEditing ? (
                      <Input
                        id="title"
                        value={editedDoc.title || extractTitle(editedDoc)}
                        onChange={(e) => setEditedDoc({ ...editedDoc, title: e.target.value })}
                        placeholder="Enter document title"
                      />
                    ) : (
                      <p className="text-sm">{extractTitle(document)}</p>
                    )}
                  </div>

                  {/* Project */}
                  <div className="space-y-2">
                    <Label htmlFor="project" className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-muted-foreground" />
                      Project
                    </Label>
                    {isEditing ? (
                      <Input
                        id="project"
                        value={editedDoc.project || extractProject(editedDoc)}
                        onChange={(e) => setEditedDoc({ ...editedDoc, project: e.target.value })}
                        placeholder="Enter project name"
                      />
                    ) : (
                      <p className="text-sm">{extractProject(document) || "Not assigned"}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Date/Time
                    </Label>
                    {isEditing ? (
                      <Input
                        id="date"
                        type="datetime-local"
                        value={editedDoc.date || extractDate(editedDoc)}
                        onChange={(e) => setEditedDoc({ ...editedDoc, date: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm">{formatDate(extractDate(document))}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      Category
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editedDoc.category || extractCategory(editedDoc)}
                        onValueChange={(value) => setEditedDoc({ ...editedDoc, category: value })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="proposal">Proposal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{extractCategory(document)}</Badge>
                    )}
                  </div>

                  {/* Document Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Document Type
                    </Label>
                    {isEditing ? (
                      <Select
                        value={editedDoc.document_type || ""}
                        onValueChange={(value) => setEditedDoc({ ...editedDoc, document_type: value })}
                      >
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="markdown">Markdown</SelectItem>
                          <SelectItem value="html">HTML</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge>{document.document_type || "Unknown"}</Badge>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    {isEditing ? (
                      <Textarea
                        id="summary"
                        value={editedDoc.summary || extractSummary(editedDoc)}
                        onChange={(e) => setEditedDoc({ ...editedDoc, summary: e.target.value })}
                        placeholder="Enter document summary"
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {extractSummary(document) || "No summary available"}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Document Content</Label>
                  {isEditing ? (
                    <Textarea
                      id="content"
                      value={editedDoc.content || ""}
                      onChange={(e) => setEditedDoc({ ...editedDoc, content: e.target.value })}
                      placeholder="Enter document content"
                      rows={20}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                      <pre className="text-sm whitespace-pre-wrap">
                        {document.content || "No content available"}
                      </pre>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Metadata Section */}
            {document.metadata && Object.keys(document.metadata).length > 0 && (
              <div className="space-y-2">
                <Label>Additional Metadata</Label>
                <ScrollArea className="h-[150px] w-full rounded-md border p-3">
                  <pre className="text-xs text-muted-foreground">
                    {JSON.stringify(document.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}