"use client";

import { useState, useMemo } from "react";
import { updateDocument, deleteDocument } from "@/app/actions/documents-full-actions";
import { DocumentDetailsSheet } from "@/components/documents/document-details-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  Filter,
  Columns3,
  LayoutGrid,
  List,
  ChevronDown,
  Search,
  Eye,
  Download,
  File,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface EditableDocumentsTableProps {
  documents: Document[];
}

// Helper functions to extract data from document
const extractTitle = (doc: Document): string => {
  // Try to extract title from metadata or content
  if (doc.metadata?.title) return doc.metadata.title;
  if (doc.metadata?.file_path) {
    const parts = doc.metadata.file_path.split('/');
    return parts[parts.length - 1].replace(/\.[^/.]+$/, '');
  }
  if (doc.content) {
    // Extract first line or heading
    const firstLine = doc.content.split('\n')[0];
    return firstLine.substring(0, 100);
  }
  return '';
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
    // Return first 200 characters of content as summary
    return doc.content.substring(0, 200);
  }
  return '';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  } catch {
    return dateStr;
  }
};

export function EditableDocumentsTable({ documents }: EditableDocumentsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedDocument, setEditedDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "list">("table");
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    project: true,
    date: true,
    category: true,
    summary: true,
    actions: true,
  });

  // Filter documents based on search and type
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = 
        (doc.content?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (doc.document_type?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, typeFilter]);

  // Get unique document types for filter
  const documentTypes = useMemo(() => {
    const types = new Set(documents.map(doc => doc.document_type).filter(Boolean));
    return Array.from(types);
  }, [documents]);

  const handleEdit = (document: Document) => {
    setEditingId(document.id);
    setEditedDocument({ ...document });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedDocument(null);
  };

  const handleSave = async () => {
    if (!editedDocument) return;

    try {
      const { error } = await updateDocument(editedDocument.id, {
        content: editedDocument.content,
        document_type: editedDocument.document_type,
        metadata: editedDocument.metadata,
      });

      if (error) {
        toast.error(`Failed to update document: ${error}`);
      } else {
        toast.success("Document updated successfully");
        setEditingId(null);
        setEditedDocument(null);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error updating document:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const { error } = await deleteDocument(id);

      if (error) {
        toast.error(`Failed to delete document: ${error}`);
      } else {
        toast.success("Document deleted successfully");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Error deleting document:", error);
    }
  };

  const getTypeColor = (type: string | null) => {
    if (!type) return "bg-gray-100 text-gray-800";
    switch (type.toLowerCase()) {
      case "pdf":
        return "bg-red-100 text-red-800";
      case "text":
        return "bg-blue-100 text-blue-800";
      case "markdown":
        return "bg-purple-100 text-purple-800";
      case "html":
        return "bg-orange-100 text-orange-800";
      case "json":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.title && <TableHead>Title</TableHead>}
            {visibleColumns.project && <TableHead className="w-[150px]">Project</TableHead>}
            {visibleColumns.date && <TableHead className="w-[180px]">Date/Time</TableHead>}
            {visibleColumns.category && <TableHead className="w-[120px]">Category</TableHead>}
            {visibleColumns.summary && <TableHead>Summary</TableHead>}
            {visibleColumns.actions && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredDocuments.map((document) => {
            const isEditing = editingId === document.id;

            return (
              <TableRow key={document.id} className={cn(isEditing && "bg-muted/50")}>
                {visibleColumns.title && (
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedDocument?.title || ""}
                        onChange={(e) =>
                          setEditedDocument((prev) =>
                            prev ? { ...prev, title: e.target.value } : null
                          )
                        }
                        placeholder="Enter title"
                        className="h-8"
                      />
                    ) : (
                      <DocumentDetailsSheet
                        document={document}
                        trigger={
                          <Button 
                            variant="link" 
                            className="w-fit px-0 text-left text-foreground font-medium h-auto"
                          >
                            {extractTitle(document) || <span className="text-muted-foreground">Untitled</span>}
                          </Button>
                        }
                      />
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.project && (
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={editedDocument?.project || ""}
                        onChange={(e) =>
                          setEditedDocument((prev) =>
                            prev ? { ...prev, project: e.target.value } : null
                          )
                        }
                        placeholder="Project name"
                        className="h-8"
                      />
                    ) : (
                      <div>
                        {extractProject(document) || <span className="text-muted-foreground">—</span>}
                      </div>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.date && (
                  <TableCell>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editedDocument?.date || ""}
                        onChange={(e) =>
                          setEditedDocument((prev) =>
                            prev ? { ...prev, date: e.target.value } : null
                          )
                        }
                        className="h-8"
                      />
                    ) : (
                      <div className="text-sm">
                        {formatDate(extractDate(document)) || <span className="text-muted-foreground">—</span>}
                      </div>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.category && (
                  <TableCell>
                    {isEditing ? (
                      <Select
                        value={editedDocument?.category || ""}
                        onValueChange={(value) =>
                          setEditedDocument((prev) =>
                            prev ? { ...prev, category: value } : null
                          )
                        }
                      >
                        <SelectTrigger className="h-8">
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
                      <Badge variant="outline">
                        {extractCategory(document) || "General"}
                      </Badge>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.summary && (
                  <TableCell>
                    {isEditing ? (
                      <Textarea
                        value={editedDocument?.summary || ""}
                        onChange={(e) =>
                          setEditedDocument((prev) =>
                            prev ? { ...prev, summary: e.target.value } : null
                          )
                        }
                        placeholder="Enter summary"
                        className="min-h-[60px]"
                      />
                    ) : (
                      <div className="max-w-[400px] line-clamp-2 text-sm">
                        {extractSummary(document) || <span className="text-muted-foreground">No summary</span>}
                      </div>
                    )}
                  </TableCell>
                )}
                
                {visibleColumns.actions && (
                  <TableCell>
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(document)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(document.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {filteredDocuments.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={Object.values(visibleColumns).filter(Boolean).length}
                className="text-center py-8 text-muted-foreground"
              >
                No documents found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredDocuments.map((document) => {
        const isEditing = editingId === document.id;

        return (
          <Card key={document.id} className={cn(isEditing && "ring-2 ring-primary")}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <Badge className={cn("font-normal", getTypeColor(document.document_type))}>
                    {document.document_type || "Unknown"}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={handleSave} className="h-6 w-6">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancel} className="h-6 w-6">
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(document)} className="h-6 w-6">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(document.id)} className="h-6 w-6 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">ID: {document.id}</div>
                {isEditing ? (
                  <Textarea
                    value={editedDocument?.content || ""}
                    onChange={(e) =>
                      setEditedDocument((prev) =>
                        prev ? { ...prev, content: e.target.value } : null
                      )
                    }
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm line-clamp-3">
                    {document.content || <span className="text-muted-foreground">No content</span>}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredDocuments.map((document) => {
        const isEditing = editingId === document.id;

        return (
          <div
            key={document.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              isEditing && "bg-muted/50"
            )}
          >
            <div className="flex items-center gap-3 flex-1">
              <File className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">#{document.id}</span>
                  <Badge className={cn("font-normal", getTypeColor(document.document_type))}>
                    {document.document_type || "Unknown"}
                  </Badge>
                </div>
                {isEditing ? (
                  <Textarea
                    value={editedDocument?.content || ""}
                    onChange={(e) =>
                      setEditedDocument((prev) =>
                        prev ? { ...prev, content: e.target.value } : null
                      )
                    }
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground truncate max-w-[500px]">
                    {document.content || "No content"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(document)} className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(document.id)} className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {documentTypes.map((type) => (
                <SelectItem key={type} value={type!}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(visibleColumns).map(([key, value]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={value}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, [key]: checked }))
                    }
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="table">
                <List className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="cards">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>

      {/* Content */}
      {viewMode === "table" && renderTableView()}
      {viewMode === "cards" && renderCardView()}
      {viewMode === "list" && renderListView()}
    </div>
  );
}