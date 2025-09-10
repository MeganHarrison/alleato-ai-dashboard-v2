"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2,
  Search,
  Edit,
  Save,
  X,
  Calendar,
  FileText,
  Download,
  Trash2,
  MoreHorizontal,
  Filter,
  Columns3,
  ChevronDown,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: number;
  content: string | null;
  document_type: string | null;
  embedding: string | null;
  metadata: any;
  title?: string | null;
  date?: string | null;
  summary?: string | null;
  project_id?: number | null;
  project?: string | null;
  storage_path?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Project {
  id: number;
  name: string | null;
}

const COLUMNS = [
  { id: "title", label: "Title", defaultVisible: true },
  { id: "date", label: "Date", defaultVisible: true },
  { id: "project", label: "Project", defaultVisible: true },
];

export default function MeetingsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.id))
  );
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editData, setEditData] = useState<Partial<Document>>({});
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [supabase] = useState(() => {
    const client = createClient();
    if (!client) {
      console.error("Failed to create Supabase client. Check environment variables.");
    }
    return client;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        throw new Error("Database connection not available. Please check your configuration.");
      }
      
      // Load documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('date', { ascending: false });
      
      if (documentsError) {
        console.error("Error loading documents:", documentsError);
        throw new Error(documentsError.message || "Failed to load documents");
      }
      
      // Load projects for the dropdown
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (projectsError) {
        console.error("Error loading projects:", projectsError);
        throw new Error(projectsError.message || "Failed to load projects");
      }
      
      setDocuments(documentsData || []);
      setProjects((projectsData || []).map(proj => ({
        id: proj.id,
        name: proj.name || 'Unnamed Project'
      })));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error in loadData:", error);
      setError(errorMessage || "Failed to load data. Please try refreshing the page.");
      toast.error("Failed to load data", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique projects for filter
  const projectOptions = useMemo(() => {
    const projectSet = new Set(documents.map(d => d.project_id).filter(Boolean));
    const projectsWithDocs = projects.filter(p => projectSet.has(p.id));
    return ["all", ...projectsWithDocs.map(p => String(p.id))];
  }, [documents, projects]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.project?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProject = projectFilter === 'all' || 
        (doc.project_id && String(doc.project_id) === projectFilter);

      return matchesSearch && matchesProject;
    });
  }, [documents, searchTerm, projectFilter]);

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setEditData({
      title: document.title,
      date: document.date,
      project_id: document.project_id,
      project: document.project,
    });
  };

  const handleSave = async () => {
    if (!editingDocument) return;
    
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      const { error } = await supabase
        .from('documents')
        .update({
          content: editData.title || editData.content,
          metadata: {
            ...editingDocument.metadata,
            title: editData.title,
            date: editData.date,
            project_id: editData.project_id,
            project: editData.project
          }
        })
        .eq('id', editingDocument.id);
      
      if (error) throw error;
      
      // Update local state
      setDocuments(documents => 
        documents.map(doc => 
          doc.id === editingDocument.id 
            ? { ...doc, ...editData, updated_at: new Date().toISOString() }
            : doc
        )
      );
      
      setEditingDocument(null);
      setEditData({});
      toast.success("Document updated successfully");
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setDocuments(documents => 
        documents.filter(doc => doc.id !== id)
      );
      
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      if (document.content) {
        const blob = new Blob([document.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.title || 'document'}.txt`;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        toast.success("Document downloaded successfully");
      } else {
        toast.error("No content available to download");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Date', 'Project'];
    const rows = filteredDocuments.map(d => [
      d.title || '',
      d.date ? format(new Date(d.date), 'yyyy-MM-dd') : '',
      d.project || projects.find(p => p.id === d.project_id)?.name || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meetings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading meetings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 p-2 sm:p-4 md:p-6 w-[95%] sm:w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Meetings</h2>
            <p className="text-muted-foreground">
              View and manage all meeting documents and transcripts
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={String(project.id)}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="h-4 w-4 mr-2" />
                Columns
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map(column => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={(checked) => {
                    const newColumns = new Set(visibleColumns);
                    if (checked) {
                      newColumns.add(column.id);
                    } else {
                      newColumns.delete(column.id);
                    }
                    setVisibleColumns(newColumns);
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.has('title') && <TableHead>Title</TableHead>}
                {visibleColumns.has('date') && <TableHead>Date</TableHead>}
                {visibleColumns.has('project') && <TableHead>Project</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No meetings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((document) => (
                  <TableRow key={document.id} className="cursor-pointer hover:bg-muted/50">
                    {visibleColumns.has('title') && (
                      <TableCell>
                        <div className="font-medium">
                          {document.title || <span className="text-muted-foreground">Untitled</span>}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.has('date') && (
                      <TableCell>
                        {document.date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(document.date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('project') && (
                      <TableCell>
                        {(document.project || projects.find(p => p.id === document.project_id)?.name) && (
                          <Badge variant="secondary" className="font-normal">
                            {document.project || projects.find(p => p.id === document.project_id)?.name}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleEdit(document)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleDownload(document)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-destructive"
                            onClick={() => handleDelete(document.id)}
                            disabled={isDeleting === document.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingDocument} onOpenChange={() => setEditingDocument(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Meeting Document</DialogTitle>
            <DialogDescription>
              Make changes to the meeting document information below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Enter meeting title..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={editData.date ? new Date(editData.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project</label>
                <Select
                  value={editData.project_id ? String(editData.project_id) : "none"}
                  onValueChange={(value) => {
                    const projectId = value === "none" ? null : Number(value);
                    const project = projectId ? projects.find(p => p.id === projectId)?.name : null;
                    setEditData({ 
                      ...editData, 
                      project_id: projectId,
                      project: project || editData.project
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDocument(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}