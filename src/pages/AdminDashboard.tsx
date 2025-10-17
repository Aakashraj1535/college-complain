import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { StatsCard } from "@/components/analytics/StatsCard";
import { ComplaintChart } from "@/components/analytics/ComplaintChart";
import { StatusDistribution } from "@/components/analytics/StatusDistribution";
import { FileText, Clock, CheckCircle, TrendingUp, LogOut, Search, Filter, User, Mail, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Mechanical Engineering", 
  "Civil Engineering",
  "Electrical Engineering",
  "IT Services",
  "Administration",
  "Hostel Management",
  "Library",
  "Sports & Recreation",
  "Canteen & Mess",
  "Security",
  "Maintenance"
];

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["admin-complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["student-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: authUsers = [] } = useQuery({
    queryKey: ["auth-users"],
    queryFn: async () => {
      const studentIds = [...new Set(complaints.map(c => c.student_id))];
      if (studentIds.length === 0) return [];
      
      const users = await Promise.all(
        studentIds.map(async (id) => {
          const { data } = await supabase.auth.admin.getUserById(id);
          return data.user;
        })
      );
      return users.filter(Boolean);
    },
    enabled: !!user && complaints.length > 0,
  });

  const assignDepartmentMutation = useMutation({
    mutationFn: async ({ complaintId, department }: { complaintId: string; department: string }) => {
      const { error } = await supabase
        .from("complaints")
        .update({ department, assigned_by: user?.id })
        .eq("id", complaintId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Department assigned successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-complaints"] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getStudentProfile = (studentId: string) => {
    return profiles.find(p => p.user_id === studentId);
  };

  const getStudentEmail = (studentId: string) => {
    const user = authUsers.find(u => u?.id === studentId);
    return user?.email || 'N/A';
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || c.department === departmentFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesDepartment && matchesPriority;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === "pending").length,
    inProgress: complaints.filter(c => c.status === "in_progress").length,
    completed: complaints.filter(c => c.status === "completed").length,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      in_progress: { variant: "default", icon: TrendingUp },
      completed: { variant: "default", icon: CheckCircle, className: "bg-success text-success-foreground" },
      issued: { variant: "destructive", icon: Clock },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return <Badge variant={config.variant} className={config.className}><Icon className="h-3 w-3 mr-1" />{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "text-muted-foreground",
      medium: "text-warning",
      high: "text-orange-500",
      critical: "text-destructive",
    };
    return <Badge variant="outline" className={colors[priority] || colors.medium}>{priority}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Dashboard</h1>
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
          <StatsCard title="In Progress" value={stats.inProgress} icon={TrendingUp} className="hover:scale-105 transition-transform" />
          <StatsCard title="Completed" value={stats.completed} icon={CheckCircle} className="hover:scale-105 transition-transform" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComplaintChart complaints={complaints} />
          <StatusDistribution complaints={complaints} />
        </div>

        <Card className="glass-card shadow-glow">
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by dept" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : filteredComplaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No complaints found.</p>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map(c => {
                  const student = getStudentProfile(c.student_id);
                  const studentEmail = getStudentEmail(c.student_id);
                  const attachments = Array.isArray(c.attachments) ? c.attachments : [];
                  return (
                    <div key={c.id} className="p-5 rounded-lg border bg-card hover:bg-accent/50 transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
                            {!c.is_anonymous && (
                              <>
                                <div className="flex items-center gap-1.5 text-foreground bg-primary/10 px-2 py-1 rounded">
                                  <User className="h-3.5 w-3.5" />
                                  <span className="font-medium">{student?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5" />
                                  <span>{studentEmail}</span>
                                </div>
                              </>
                            )}
                            {c.is_anonymous && (
                              <Badge variant="outline" className="bg-muted">Anonymous</Badge>
                            )}
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(c.priority || 'medium')}
                          {getStatusBadge(c.status)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                      
                      {attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium mb-2 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Evidence Attachments ({attachments.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((url: string, idx: number) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative overflow-hidden rounded-lg border hover:border-primary transition-all"
                              >
                                <img 
                                  src={url} 
                                  alt={`Evidence ${idx + 1}`}
                                  className="h-20 w-20 object-cover group-hover:scale-110 transition-transform"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23ddd" width="80" height="80"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EFile%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{c.category}</span>
                        {!c.department ? (
                          <Select onValueChange={(dept) => assignDepartmentMutation.mutate({ complaintId: c.id, department: dept })}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Assign Department" /></SelectTrigger>
                            <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">Dept: {c.department}</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {selectedStudent?.name?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{selectedStudent?.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {selectedStudent?.user_id}
                </p>
              </div>
            </div>
            {selectedStudent?.department && (
              <div>
                <p className="text-sm font-medium">Department</p>
                <p className="text-sm text-muted-foreground">{selectedStudent.department}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;