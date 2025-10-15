import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ComplaintTimeline } from "@/components/complaints/ComplaintTimeline";
import { StatsCard } from "@/components/analytics/StatsCard";
import { FileText, Clock, CheckCircle, AlertCircle, Send, LogOut, Upload, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Infrastructure - Hostel", "Infrastructure - Classroom", "Infrastructure - Lab", "Academic - Course", "Academic - Exam", "Academic - Faculty", "Administrative - Fee", "Administrative - Certificate", "Administrative - Library", "IT Services", "Canteen & Mess", "Security", "Others"];
const PRIORITIES = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-warning" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "critical", label: "Critical", color: "text-destructive" },
];

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["complaints", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.from("complaints").select("*").eq("student_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["complaint-history", selectedComplaint?.id],
    queryFn: async () => {
      if (!selectedComplaint?.id) return [];
      const { data, error } = await supabase.from("complaint_history").select("*").eq("complaint_id", selectedComplaint.id).order("changed_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedComplaint?.id,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel("student-complaints").on("postgres_changes", { event: "*", schema: "public", table: "complaints", filter: `student_id=eq.${user.id}` }, () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const uploadFiles = async (complaintId: string) => {
    if (attachments.length === 0) return [];
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${complaintId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('complaint-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('complaint-attachments')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }
    } finally {
      setUploading(false);
    }
    return uploadedUrls;
  };

  const createComplaintMutation = useMutation({
    mutationFn: async (newComplaint: any) => {
      const { data, error } = await supabase.from("complaints").insert([newComplaint]).select().single();
      if (error) throw error;
      
      if (attachments.length > 0) {
        const urls = await uploadFiles(data.id);
        await supabase.from("complaints").update({ attachments: urls }).eq("id", data.id);
      }
      
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Your complaint has been filed successfully." });
      setTitle(""); setDescription(""); setCategory(""); setPriority("medium");
      setIsAnonymous(false); setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => {
        const isValid = file.size <= 50 * 1024 * 1024; // 50MB
        if (!isValid) {
          toast({ title: "File too large", description: `${file.name} exceeds 50MB limit.`, variant: "destructive" });
        }
        return isValid;
      });
      setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    }
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    createComplaintMutation.mutate({ 
      student_id: user?.id, 
      title: title.trim(), 
      description: description.trim(), 
      category, 
      priority, 
      status: "pending",
      is_anonymous: isAnonymous
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: AlertCircle },
      completed: { variant: "default", icon: CheckCircle, className: "bg-success text-success-foreground" },
      issued: { variant: "destructive", icon: AlertCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return <Badge variant={config.variant} className={config.className}><Icon className="h-3 w-3 mr-1" />{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1];
    return <Badge variant="outline" className={config.color}>{config.label}</Badge>;
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    inProgress: complaints.filter(c => c.status === "in_progress").length,
    completed: complaints.filter(c => c.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Student Dashboard</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button onClick={signOut} variant="ghost" size="sm"><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Complaints" value={stats.total} icon={FileText} className="hover:scale-105 transition-transform" />
          <StatsCard title="Pending" value={stats.pending} icon={Clock} className="hover:scale-105 transition-transform" />
          <StatsCard title="In Progress" value={stats.inProgress} icon={AlertCircle} className="hover:scale-105 transition-transform" />
          <StatsCard title="Completed" value={stats.completed} icon={CheckCircle} className="hover:scale-105 transition-transform" />
        </div>

        <Card className="glass-card shadow-glow">
          <CardHeader><CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />File a New Complaint</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium">Title</label><Input placeholder="Brief description" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea placeholder="Detailed information" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required /></div>
              
              <div className="flex items-center space-x-2 p-3 bg-accent/30 rounded-lg">
                <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                <Label htmlFor="anonymous" className="cursor-pointer">Submit anonymously (Admin can still view your profile)</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Attach Evidence (Images/Videos - Max 5 files, 50MB each)
                </Label>
                <Input type="file" accept="image/*,video/*,application/pdf" multiple onChange={handleFileChange} className="cursor-pointer" />
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attachments.map((file, idx) => (
                      <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1">
                        {file.name.slice(0, 20)}
                        <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0 ml-1" onClick={() => removeFile(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" disabled={createComplaintMutation.isPending || uploading} className="w-full">
                {uploading ? "Uploading files..." : createComplaintMutation.isPending ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card shadow-glow">
          <CardHeader><CardTitle>My Complaints</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div> : complaints.length === 0 ? <p className="text-center text-muted-foreground py-8">No complaints yet.</p> :
              <div className="space-y-3">
                {complaints.map(c => <div key={c.id} onClick={() => setSelectedComplaint(c)} className="p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-all hover:shadow-md">
                  <div className="flex justify-between items-start mb-2"><h3 className="font-semibold">{c.title}</h3><div className="flex gap-2">{getPriorityBadge(c.priority)}{getStatusBadge(c.status)}</div></div>
                  <p className="text-sm text-muted-foreground mb-2">{c.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{c.category}</span>{c.department && <span>Dept: {c.department}</span>}<span>{new Date(c.created_at).toLocaleDateString()}</span></div>
                </div>)}
              </div>
            }
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!selectedComplaint} onOpenChange={() => setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedComplaint?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">{selectedComplaint && getPriorityBadge(selectedComplaint.priority)}{selectedComplaint && getStatusBadge(selectedComplaint.status)}</div>
            <div><h4 className="font-semibold mb-2">Description</h4><p className="text-sm text-muted-foreground">{selectedComplaint?.description}</p></div>
            <ComplaintTimeline history={history} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
