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
import { FileText, Clock, CheckCircle, AlertCircle, Send, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

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

  const createComplaintMutation = useMutation({
    mutationFn: async (newComplaint: any) => {
      const { data, error } = await supabase.from("complaints").insert([newComplaint]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Your complaint has been filed successfully." });
      setTitle(""); setDescription(""); setCategory(""); setPriority("medium");
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error) => { toast({ title: "Error", description: error.message, variant: "destructive" }); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      toast({ title: "Error", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    createComplaintMutation.mutate({ student_id: user?.id, title: title.trim(), description: description.trim(), category, priority, status: "pending" });
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
              <Button type="submit" disabled={createComplaintMutation.isPending} className="w-full">{createComplaintMutation.isPending ? "Submitting..." : "Submit Complaint"}</Button>
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
