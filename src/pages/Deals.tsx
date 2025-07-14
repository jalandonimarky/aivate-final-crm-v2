import { useState } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCRMData } from "@/hooks/useCRMData";
import type { Contact, Deal, Profile } from "@/types/crm"; // Import all necessary types

interface DealFormData {
  title: string;
  description: string;
  value: number;
  stage: Deal['stage']; // Explicitly type stage
  tier: string | null; // Changed to string | null
  contact_id: string;
  assigned_to: string;
  expected_close_date: Date | undefined;
}

export function Deals() {
  const { deals, contacts, profiles, loading, createDeal, updateDeal, deleteDeal, getFullName } = useCRMData();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState<DealFormData>({ // Use the new interface here
    title: "",
    description: "",
    value: 0,
    stage: "lead", // Default to new 'lead' stage
    tier: null, // Initialize with null
    contact_id: "unassigned", // Initialize with "unassigned"
    assigned_to: "unassigned", // Initialize with "unassigned"
    expected_close_date: undefined,
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // New state for calendar popover

  const dealStages: { value: Deal['stage'], label: string }[] = [ // Explicitly type dealStages
    { value: "lead", label: "Lead" },
    { value: "in_development", label: "In Development" },
    { value: "proposal", label: "Proposal" },
    { value: "discovery_call", label: "Discovery Call" },
    { value: "paid", label: "Paid" },
    { value: "done_completed", label: "Done Completed" },
    { value: "cancelled", label: "Cancelled" }, // Added new stage
  ];

  const dealTiers: string[] = [
    "1-OFF Projects: T1",
    "1-OFF Projects: T2",
    "1-OFF Projects: T3",
    "System Development: T1",
    "System Development: T2",
    "System Development: T3",
  ];

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.assigned_user && getFullName(deal.assigned_user).toLowerCase().includes(searchTerm.toLowerCase())) ||
    deal.tier?.toLowerCase().includes(searchTerm.toLowerCase()) // Filter by tier
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        value: Number(formData.value),
        expected_close_date: formData.expected_close_date ? format(formData.expected_close_date, "yyyy-MM-dd") : null,
        contact_id: formData.contact_id === "unassigned" ? null : formData.contact_id, // Convert "unassigned" to null
        assigned_to: formData.assigned_to === "unassigned" ? null : formData.assigned_to, // Convert "unassigned" to null
        // tier is already null if no selection, no need for extra check
      };

      if (editingDeal) {
        await updateDeal(editingDeal.id, dataToSubmit);
      } else {
        await createDeal(dataToSubmit);
      }
      resetForm();
      setDialogOpen(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      value: 0,
      stage: "lead", // Reset to new 'lead' stage
      tier: null, // Reset to null
      contact_id: "unassigned", // Reset to "unassigned"
      assigned_to: "unassigned", // Reset to "unassigned"
      expected_close_date: undefined,
    });
    setEditingDeal(null);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setFormData({
      title: deal.title,
      description: deal.description || "",
      value: deal.value,
      stage: deal.stage,
      tier: deal.tier || null, // Set to null if null
      contact_id: deal.contact_id || "unassigned", // Set to "unassigned" if null
      assigned_to: deal.assigned_to || "unassigned", // Set to "unassigned" if null
      expected_close_date: deal.expected_close_date ? new Date(deal.expected_close_date) : undefined,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      await deleteDeal(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Deals
          </h1>
          <p className="text-muted-foreground">
            Track your sales opportunities and pipeline
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-primary hover:bg-primary/90 text-primary-foreground shadow-glow transition-smooth"
              onClick={resetForm}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingDeal ? "Edit Deal" : "Add New Deal"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Added sm:grid-cols-2 */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Added sm:grid-cols-2 */}
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage *</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as Deal['stage'] }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealStages.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tier">Tier</Label> {/* Added Tier dropdown */}
                  <Select
                    value={formData.tier || "none-tier"} // Use "none-tier" when formData.tier is null
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value === "none-tier" ? null : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none-tier">None</SelectItem> {/* Use a non-empty string value */}
                      {dealTiers.map(tier => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Added sm:grid-cols-2 */}
                <div className="space-y-2">
                  <Label htmlFor="contact_id">Related Contact</Label>
                  <Select
                    value={formData.contact_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contact_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">None</SelectItem>
                      {contacts.map(contact => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} ({contact.company})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">None</SelectItem>
                      {profiles.map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {getFullName(profile)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}> {/* Control popover with new state */}
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.expected_close_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expected_close_date ? format(formData.expected_close_date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expected_close_date}
                      onSelect={(date) => {
                        setFormData(prev => ({ ...prev, expected_close_date: date || undefined }));
                        setIsCalendarOpen(false); // Close calendar on date selection
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-primary">
                  {editingDeal ? "Update" : "Create"} Deal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Deals Table */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>All Deals ({filteredDeals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto"> {/* Added overflow-x-auto */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Tier</TableHead> {/* Added Tier column */}
                  <TableHead>Contact</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id} className="hover:bg-muted/50 transition-smooth">
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>${deal.value.toLocaleString()}</TableCell>
                    <TableCell>{deal.stage}</TableCell>
                    <TableCell>{deal.tier || "-"}</TableCell> {/* Display tier */}
                    <TableCell>{deal.contact?.name || "-"}</TableCell>
                    <TableCell>{deal.assigned_user ? getFullName(deal.assigned_user) : "-"}</TableCell>
                    <TableCell>{deal.expected_close_date ? format(new Date(deal.expected_close_date), "PPP") : "-"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(deal)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(deal.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDeals.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No deals found matching your search." : "No deals yet. Create your first deal!"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}