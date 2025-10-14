import React, { useState, useEffect } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useCRMData } from "@/hooks/useCRMData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, Clock, Plus, Upload, Download, Paperclip } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, parse, formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { UserProfileCard } from "@/components/UserProfileCard";
import { KanbanPriorityBadge } from "@/components/kanban/KanbanPriorityBadge";
import { Badge } from "@/components/ui/badge";
import { KanbanItemFormDialog } from "@/components/kanban/KanbanItemFormDialog";
import { TenantInfoFormDialog } from "@/components/kanban/TenantInfoFormDialog";
import { HousingInfoFormDialog } from "@/components/kanban/HousingInfoFormDialog";
import { KanbanStatusBadge } from "@/components/kanban/KanbanStatusBadge";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { CollapsibleCard } from "@/components/CollapsibleCard";
import type { KanbanItem, KanbanItemNote, Task, KanbanItemAttachment } from "@/types/crm";
import { useToast } from "@/hooks/use-toast";

interface TaskFormData {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  assigned_to: string;
  related_contact_id: string;
  related_deal_id: string;
  related_kanban_item_id: string;
  due_date: Date | undefined;
}

// Helper to check for valid URL
const isValidUrl = (urlString: string | null | undefined): boolean => {
  if (!urlString) return false;
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
};

export function KanbanItemDetails() {
  const {
    kanbanItems,
    profiles,
    contacts,
    deals,
    loading,
    updateKanbanItem,
    deleteKanbanItem,
    createKanbanItemNote,
    updateKanbanItemNote,
    deleteKanbanItemNote,
    createTask,
    updateTask,
    deleteTask,
    createKanbanItemAttachment,
    deleteKanbanItemAttachment,
    getFullName,
  } = useCRMData();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const item = kanbanItems.find((i) => i.id === id);

  const [isItemFormDialogOpen, setIsItemFormDialogOpen] = useState(false);
  const [isTenantInfoDialogOpen, setIsTenantInfoDialogOpen] = useState(false);
  const [isHousingInfoDialogOpen, setIsHousingInfoDialogOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<KanbanItemNote | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    assigned_to: "unassigned",
    related_contact_id: "unassigned",
    related_deal_id: "unassigned",
    related_kanban_item_id: "unassigned",
    due_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [isUploadAttachmentDialogOpen, setIsUploadAttachmentDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<'image' | 'document' | 'other'>('other');
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const taskStatuses: { value: Task['status'], label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const taskPriorities: { value: Task['priority'], label: string }[] = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ];

  useEffect(() => {
    if (!loading && id && !kanbanItems.find((i) => i.id === id)) {
      navigate("/kanban");
    }
  }, [kanbanItems, id, loading, navigate]);

  useEffect(() => {
    if (item) {
      setTaskFormData(prev => ({ ...prev, related_kanban_item_id: item.id }));
    }
  }, [item]);

  const handleEditItemClick = () => {
    setIsItemFormDialogOpen(true);
  };

  const handleUpdateItemSubmit = async (data: any) => {
    if (!item) return;
    await updateKanbanItem(item.id, data);
    setIsItemFormDialogOpen(false);
  };

  const handleUpdateTenantInfoSubmit = async (data: Partial<KanbanItem>) => {
    if (!item) return;
    await updateKanbanItem(item.id, data);
    setIsTenantInfoDialogOpen(false);
  };

  const handleUpdateHousingInfoSubmit = async (data: Partial<KanbanItem>) => {
    if (!item) return;
    await updateKanbanItem(item.id, data);
    setIsHousingInfoDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (confirm("Are you sure you want to delete this Kanban item? This action cannot be undone.")) {
      try {
        if (id) {
          await deleteKanbanItem(id);
          navigate("/kanban");
        }
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNoteContent.trim()) return;
    try {
      await createKanbanItemNote(id, newNoteContent);
      setNewNoteContent("");
      setIsAddingNote(false);
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleEditNoteClick = (note: KanbanItemNote) => {
    setEditingNote(note);
    setEditNoteContent(note.content);
    setIsEditNoteDialogOpen(true);
  };

  const handleUpdateNoteSubmit = async () => {
    if (!editingNote || !editNoteContent.trim()) return;
    try {
      await updateKanbanItemNote(editingNote.id, editingNote.kanban_item_id, { content: editNoteContent });
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      setEditNoteContent("");
    } catch (error) {
      // Error handled in useCRMData hook
    }
  };

  const handleDeleteNote = async (noteId: string, kanbanItemId: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteKanbanItemNote(noteId, kanbanItemId);
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const resetTaskForm = () => {
    setTaskFormData({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      assigned_to: "unassigned",
      related_contact_id: "unassigned",
      related_deal_id: "unassigned",
      related_kanban_item_id: id || "unassigned",
      due_date: undefined,
    });
    setEditingTask(null);
  };

  const handleAddTaskClick = () => {
    resetTaskForm();
    setIsTaskDialogOpen(true);
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || "unassigned",
      related_contact_id: task.related_contact_id || "unassigned",
      related_deal_id: task.related_deal_id || "unassigned",
      related_kanban_item_id: task.related_kanban_item_id || id || "unassigned",
      due_date: task.due_date ? new Date(task.due_date) : undefined,
    });
    setIsTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const dataToSubmit = {
        ...taskFormData,
        due_date: taskFormData.due_date ? format(taskFormData.due_date, "yyyy-MM-dd") : null,
        assigned_to: taskFormData.assigned_to === "unassigned" ? null : taskFormData.assigned_to,
        related_contact_id: taskFormData.related_contact_id === "unassigned" ? null : taskFormData.related_contact_id,
        related_deal_id: taskFormData.related_deal_id === "unassigned" ? null : taskFormData.related_deal_id, // FIX: Ensure conversion to null
        related_kanban_item_id: id,
      };
      if (editingTask) {
        await updateTask(editingTask.id, dataToSubmit);
      } else {
        await createTask(dataToSubmit);
      }
      resetTaskForm();
      setIsTaskDialogOpen(false);
    } catch (error) {
      // Error handled in the hook
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        // Error handled in the hook
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadAttachment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    setUploadingAttachment(true);
    try {
      await createKanbanItemAttachment(id, selectedFile, attachmentType);
      setSelectedFile(null);
      setAttachmentType('other');
      setIsUploadAttachmentDialogOpen(false);
    } catch (error) {
      // Error handled in useCRMData hook
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (attachment: KanbanItemAttachment) => {
    if (confirm("Are you sure you want to delete this attachment? This action cannot be undone.")) {
      try {
        const pathSegments = attachment.file_url.split('/');
        const filePathInBucket = pathSegments.slice(pathSegments.indexOf('kanban-item-attachments') + 1).join('/');
        
        await deleteKanbanItemAttachment(attachment.id, attachment.kanban_item_id, filePathInBucket);
      } catch (error) {
        // Error handled in useCRMData hook
      }
    }
  };

  const getCategoryColorClass = (category?: KanbanItem['category']) => {
    switch (category?.toLowerCase()) {
      case 'real estate': return "bg-primary/20 text-foreground border-primary/40";
      case 'tech solutions': return "bg-accent/20 text-foreground border-accent/40";
      default: return "bg-secondary text-secondary-foreground border-secondary";
    }
  };

  if (loading || !item) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => navigate("/kanban")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Kanban
        </Button>
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const sortedNotes = (item.notes || []).sort((a: KanbanItemNote, b: KanbanItemNote) => 
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );

  const relatedTasks = (item.tasks || []).sort((a: Task, b: Task) => 
    (a.due_date ? parseISO(a.due_date).getTime() : Infinity) - (b.due_date ? parseISO(b.due_date).getTime() : Infinity)
  );

  const sortedAttachments = (item.attachments || []).sort((a: KanbanItemAttachment, b: KanbanItemAttachment) =>
    parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
  );

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => navigate(`/kanban?boardId=${item.column?.board_id || ''}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Board
      </Button>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold min-w-0 mr-2">
              {item.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEditItemClick}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDeleteItem}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <p>
              In column <span className="font-semibold">{item.column?.name || "N/A"}</span>
            </p>
            {item.created_at && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs">{formatDistanceToNowStrict(parseISO(item.created_at), { addSuffix: true })}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <KanbanStatusBadge status={item.status} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Priority</p>
              <KanbanPriorityBadge priority={item.priority_level} />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Category</p>
              {item.category ? <Badge variant="outline" className={cn("text-sm px-2 py-0.5", getCategoryColorClass(item.category))}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Badge> : <p className="font-semibold">N/A</p>}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Assigned To</p>
              {item.assigned_user ? <UserProfileCard profile={item.assigned_user} /> : <p className="font-semibold">N/A</p>}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-semibold">{item.due_date ? format(parseISO(item.due_date), "PPP") : "N/A"}</p>
            </div>
          </div>
          
          <Separator />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-foreground whitespace-pre-wrap">{item.description || "No description provided."}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">PR Link</p>
              {isValidUrl(item.pr_link) ? (
                <a href={item.pr_link!} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline break-all">
                  {item.pr_link}
                </a>
              ) : (
                <p className="font-semibold">{item.pr_link || "N/A"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notes" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Notes</TabsTrigger>
          <TabsTrigger value="subtasks" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Subtasks</TabsTrigger>
          <TabsTrigger value="attachments" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Attachments</TabsTrigger>
          <TabsTrigger value="more-info" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">More Information</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Notes ({sortedNotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedNotes.length === 0 && !isAddingNote && <p className="text-muted-foreground text-sm">No notes yet for this item.</p>}
                {sortedNotes.map((note: KanbanItemNote) => (
                  <div key={note.id} className="border-b border-border/50 pb-3 last:border-b-0 last:pb-0 flex justify-between items-start">
                    <div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Added by {note.creator ? getFullName(note.creator) : "Unknown"} on {format(parseISO(note.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEditNoteClick(note)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteNote(note.id, note.kanban_item_id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
                
                {isAddingNote ? (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="new-note-content">Add New Note</Label>
                    <Textarea id="new-note-content" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Type your note here..." rows={3} />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingNote(false)}>Cancel</Button>
                      <Button onClick={handleAddNote} className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">Add Note</Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setIsAddingNote(true)}
                    className="w-full bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Note
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subtasks">
          <CollapsibleCard
            title={`Related Tasks (${relatedTasks.length})`}
            storageKey="kanban-related-tasks-collapsed"
            optionsMenu={
              <Button variant="outline" size="sm" onClick={handleAddTaskClick} className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95">
                <Plus className="w-4 h-4 mr-2" /> Add Task
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedTasks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No tasks related to this Kanban item yet.</TableCell></TableRow>
                  ) : (
                    relatedTasks.map((task) => (
                      <TableRow key={task.id} className="hover:bg-muted/50 transition-smooth">
                        <TableCell className="font-bold">
                          <NavLink to={`/tasks/${task.id}`} className="text-foreground hover:underline">
                            {task.title}
                          </NavLink>
                        </TableCell>
                        <TableCell><TaskStatusBadge status={task.status} /></TableCell>
                        <TableCell><TaskPriorityBadge priority={task.priority} /></TableCell>
                        <TableCell>{task.assigned_user ? getFullName(task.assigned_user) : "-"}</TableCell>
                        <TableCell>{task.due_date ? format(new Date(task.due_date), "PPP") : "-"}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 active:scale-95"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleEditTaskClick(task)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleCard>
        </TabsContent>

        <TabsContent value="attachments">
          <CollapsibleCard
            title={`Attachments (${sortedAttachments.length})`}
            storageKey="kanban-attachments-collapsed"
            defaultOpen={true}
            optionsMenu={
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsUploadAttachmentDialogOpen(true)}
                className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth active:scale-95"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Attachment
              </Button>
            }
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAttachments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No attachments yet for this item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAttachments.map((attachment) => (
                      <TableRow key={attachment.id} className="hover:bg-muted/50 transition-smooth">
                        <TableCell className="font-medium flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <a 
                            href={attachment.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline"
                          >
                            {attachment.file_name}
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {attachment.attachment_type.charAt(0).toUpperCase() + attachment.attachment_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{attachment.uploader ? getFullName(attachment.uploader) : "Unknown"}</TableCell>
                        <TableCell>{format(parseISO(attachment.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem asChild>
                                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAttachment(attachment)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleCard>
        </TabsContent>

        <TabsContent value="more-info" className="space-y-6">
          <CollapsibleCard
            title="Tenant Lead Information"
            storageKey="kanban-tenant-info-collapsed"
            optionsMenu={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsTenantInfoDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Tenant Info
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">Client Category</p><p className="font-semibold">{item.client_category || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Tenant Name</p><p className="font-semibold">{item.tenant_contact_full_name || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Tenant Phone</p><p className="font-semibold">{item.tenant_contact_phone || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Tenant Email</p><p className="font-semibold">{item.tenant_contact_email || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Bedrooms Needed</p><p className="font-semibold">{item.bedrooms_needed || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Bathrooms Needed</p><p className="font-semibold">{item.bathrooms_needed || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Desired Move-in Date</p><p className="font-semibold">{item.desired_move_in_date ? format(parseISO(item.desired_move_in_date), "PPP") : "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Do you have pets? If yes, how many?</p><p className="font-semibold">{item.pets_info || "N/A"}</p></div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Household Composition</p><p className="font-semibold whitespace-pre-wrap">{item.household_composition || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Preferred Locations</p><p className="font-semibold whitespace-pre-wrap">{item.preferred_locations || "N/A"}</p></div>
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            title="Housing Lead Information"
            storageKey="kanban-housing-info-collapsed"
            optionsMenu={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 active:scale-95">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setIsHousingInfoDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Housing Info
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">Property Manager / Host</p><p className="font-semibold">{item.property_manager_name || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Contact Phone</p><p className="font-semibold">{item.property_contact_phone || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Contact Email</p><p className="font-semibold">{item.property_contact_email || "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Bedrooms</p><p className="font-semibold">{item.property_bedrooms ?? "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Bathrooms</p><p className="font-semibold">{item.property_bathrooms ?? "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">Square Footage</p><p className="font-semibold">{item.property_sq_ft ? `${item.property_sq_ft} sq ft` : "N/A"}</p></div>
              <div><p className="text-sm text-muted-foreground">MTR-Approved</p><p className="font-semibold">{typeof item.property_mtr_approved === 'boolean' ? (item.property_mtr_approved ? "Yes" : "No") : "N/A"}</p></div>
            </div>
            <Separator className="my-4" />
            <div>
              <p className="text-sm text-muted-foreground">Property Full Address</p>
              <p className="font-semibold whitespace-pre-wrap">{item.property_full_address || "N/A"}</p>
            </div>
          </CollapsibleCard>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Note</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-note-content">Note Content</Label>
              <Textarea id="edit-note-content" value={editNoteContent} onChange={(e) => setEditNoteContent(e.target.value)} rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateNoteSubmit} className="active:scale-95">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {item && (
        <KanbanItemFormDialog
          isOpen={isItemFormDialogOpen}
          onOpenChange={setIsItemFormDialogOpen}
          initialData={item}
          columnId={item.column_id}
          onSubmit={handleUpdateItemSubmit}
          nextOrderIndex={item.order_index}
          profiles={profiles}
          getFullName={getFullName}
        />
      )}

      {item && (
        <TenantInfoFormDialog
          isOpen={isTenantInfoDialogOpen}
          onOpenChange={setIsTenantInfoDialogOpen}
          initialData={item}
          onSubmit={handleUpdateTenantInfoSubmit}
        />
      )}

      {item && (
        <HousingInfoFormDialog
          isOpen={isHousingInfoDialogOpen}
          onOpenChange={setIsHousingInfoDialogOpen}
          initialData={item}
          onSubmit={handleUpdateHousingInfoSubmit}
        />
      )}

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>{editingTask ? "Edit Task" : "Add New Task"}</DialogTitle></DialogHeader>
          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input id="task-title" value={taskFormData.title} onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea id="task-description" value={taskFormData.description} onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-status">Status *</Label>
                <Select value={taskFormData.status} onValueChange={(value) => setTaskFormData(prev => ({ ...prev, status: value as Task['status'] }))} required>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{taskStatuses.map(status => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority *</Label>
                <Select value={taskFormData.priority} onValueChange={(value) => setTaskFormData(prev => ({ ...prev, priority: value as Task['priority'] }))} required>
                  <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>{taskPriorities.map(priority => <SelectItem key={priority.value} value={priority.value}>{priority.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-assigned_to">Assigned To</Label>
                <Select value={taskFormData.assigned_to} onValueChange={(value) => setTaskFormData(prev => ({ ...prev, assigned_to: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select a user" /></SelectTrigger>
                  <SelectContent>{profiles.map(profile => <SelectItem key={profile.id} value={profile.id}>{getFullName(profile)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due_date">Due Date</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !taskFormData.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {taskFormData.due_date ? format(taskFormData.due_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={taskFormData.due_date} onSelect={(date) => { setTaskFormData(prev => ({ ...prev, due_date: date || undefined })); setIsCalendarOpen(false); }} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-related_contact_id">Related Contact</Label>
                <Select value={taskFormData.related_contact_id} onValueChange={(value) => setTaskFormData(prev => ({ ...prev, related_contact_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {contacts.map(contact => <SelectItem key={contact.id} value={contact.id}>{contact.name} ({contact.company})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-related_deal_id">Related Deal</Label>
                <Select value={taskFormData.related_deal_id} onValueChange={(value) => setTaskFormData(prev => ({ ...prev, related_deal_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select a deal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">None</SelectItem>
                    {deals.map(d => <SelectItem key={d.id} value={d.id}>{d.title} (${d.value.toLocaleString()})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-related_kanban_item_id">Related Kanban Item</Label>
              <Select value={taskFormData.related_kanban_item_id} onValueChange={(value) => setTaskFormData(prev => ({ ...prev, related_kanban_item_id: value }))} disabled>
                <SelectTrigger><SelectValue placeholder="Select a Kanban item" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {kanbanItems.map(item => <SelectItem key={item.id} value={item.id}>{item.title} ({item.column?.name || 'No Column'})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-primary active:scale-95">{editingTask ? "Update" : "Create"} Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadAttachmentDialogOpen} onOpenChange={setIsUploadAttachmentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadAttachment} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">File</Label>
              <Input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment-type">Attachment Type</Label>
              <Select value={attachmentType} onValueChange={(value) => setAttachmentType(value as 'image' | 'document' | 'other')} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadAttachmentDialogOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-primary active:scale-95" disabled={uploadingAttachment}>
                {uploadingAttachment ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}