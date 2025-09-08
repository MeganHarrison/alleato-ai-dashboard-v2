"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { PageHeader } from "@/components/page-header";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2,
  Search,
  Edit,
  Save,
  X,
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string | null;
  summary: string | null;
  project_id: number | null;
  processing_status: string | null;
  participants: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  date: string;
  duration_minutes: number | null;
  fireflies_id: string | null;
  fireflies_link: string | null;
  transcript_url: string | null;
  category: string | null;
  tags: string[] | null;
}

interface Project {
  id: number;
  name: string | null;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedMeeting, setEditedMeeting] = useState<Partial<Meeting>>({});
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<string>("");
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
      
      // Check if Supabase client is available
      if (!supabase) {
        throw new Error("Database connection not available. Please check your configuration.");
      }
      
      // Check authentication status (optional in development)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.warn("Authentication warning:", authError);
        // In development, continue without authentication
        // In production, you might want to throw an error or redirect to login
        console.log("Continuing without authentication (development mode)");
      } else {
        console.log("Authenticated user:", user?.email);
      }
      
      // Load meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (meetingsError) {
        console.error("Error loading meetings:", {
          message: meetingsError.message,
          details: meetingsError.details,
          hint: meetingsError.hint,
          code: meetingsError.code
        });
        throw new Error(meetingsError.message || "Failed to load meetings");
      }
      
      console.log("Meetings loaded:", meetingsData?.length || 0);
      
      // Load projects for the dropdown
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      
      if (projectsError) {
        console.error("Error loading projects:", {
          message: projectsError.message,
          details: projectsError.details,
          hint: projectsError.hint,
          code: projectsError.code
        });
        throw new Error(projectsError.message || "Failed to load projects");
      }
      
      console.log("Projects loaded:", projectsData?.length || 0);
      
      setMeetings((meetingsData || []).map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        summary: meeting.summary,
        project_id: meeting.project_id,
        processing_status: meeting.processing_status,
        participants: meeting.participants,
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
        date: meeting.date,
        duration_minutes: meeting.duration_minutes,
        fireflies_id: meeting.fireflies_id,
        fireflies_link: meeting.fireflies_link,
        transcript_url: meeting.transcript_url,
        category: meeting.category,
        tags: meeting.tags
      })));
      setProjects((projectsData || []).map(proj => ({
        id: proj.id,
        name: proj.name || 'Unnamed Project'
      })));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error in loadData:", {
        error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      setError(errorMessage || "Failed to load data. Please try refreshing the page.");
      toast.error("Failed to load data", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingId(meeting.id);
    setEditedMeeting({ ...meeting });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedMeeting({});
  };

  const handleSave = async () => {
    if (!editingId || !editedMeeting) return;
    
    try {
      if (!supabase) {
        throw new Error('Database connection not available');
      }
      
      const { error } = await supabase
        .from('meetings')
        .update({
          title: editedMeeting.title,
          summary: editedMeeting.summary,
          project_id: editedMeeting.project_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);
      
      if (error) throw error;
      
      // Update local state
      setMeetings(meetings => 
        meetings.map(meeting => 
          meeting.id === editingId 
            ? { ...meeting, ...editedMeeting, updated_at: new Date().toISOString() }
            : meeting
        )
      );
      
      setEditingId(null);
      setEditedMeeting({});
      toast.success("Meeting updated successfully");
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Failed to update document");
    }
  };

  const handleFieldChange = (field: keyof Meeting, value: any) => {
    setEditedMeeting(prev => ({ ...prev, [field]: value }));
  };

  const openSummaryDialog = (summary: string) => {
    setSelectedSummary(summary);
    setSummaryDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig = {
      pending: { color: "bg-yellow-500/10 text-yellow-600", icon: AlertCircle },
      processing: { color: "bg-blue-500/10 text-blue-600", icon: Loader2 },
      completed: { color: "bg-green-500/10 text-green-600", icon: CheckCircle },
      failed: { color: "bg-red-500/10 text-red-600", icon: X }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge className={cn("gap-1", config.color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredMeetings = meetings.filter(meeting =>
    searchTerm === "" ||
    meeting.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    meeting.participants?.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <PageHeader 
          title="Meetings & Documents" 
          description="View and manage all meeting transcripts and documents" 
        />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search meetings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[250px]">Title</TableHead>
              <TableHead className="min-w-[120px]">Date</TableHead>
              <TableHead className="min-w-[300px]">Summary</TableHead>
              <TableHead className="min-w-[150px]">Project</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMeetings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No meetings found
                </TableCell>
              </TableRow>
            ) : (
              filteredMeetings.map((meeting) => {
                const isEditing = editingId === meeting.id;
                const currentMeeting = isEditing ? editedMeeting : meeting;
                
                return (
                  <TableRow key={meeting.id}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={currentMeeting.title || ""}
                          onChange={(e) => handleFieldChange("title", e.target.value)}
                          className="min-w-[200px]"
                        />
                      ) : (
                        <div className="font-medium">{meeting.title}</div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {meeting.date 
                          ? format(new Date(meeting.date), "MMM d, yyyy")
                          : meeting.created_at
                          ? format(new Date(meeting.created_at), "MMM d, yyyy")
                          : "No date"
                        }
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={currentMeeting.summary || ""}
                          onChange={(e) => handleFieldChange("summary", e.target.value)}
                          className="min-w-[250px] min-h-[80px]"
                          placeholder="Enter summary..."
                        />
                      ) : (
                        <div 
                          className="text-sm text-muted-foreground cursor-pointer hover:text-foreground line-clamp-2"
                          onClick={() => meeting.summary && openSummaryDialog(meeting.summary)}
                        >
                          {meeting.summary || "No summary"}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={currentMeeting.project_id ? String(currentMeeting.project_id) : "none"}
                          onValueChange={(value) => handleFieldChange("project_id", value === "none" ? null : Number(value))}
                        >
                          <SelectTrigger className="min-w-[150px]">
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
                      ) : (
                        <div>
                          {meeting.project_id 
                            ? projects.find(p => p.id === meeting.project_id)?.name || "Unknown"
                            : <span className="text-muted-foreground">No project</span>
                          }
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(meeting.processing_status)}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSave}
                            className="h-8 w-8 p-0"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancel}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(meeting)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Document Summary</DialogTitle>
            <DialogDescription>
              Full summary of the document
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap text-sm">
            {selectedSummary}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}