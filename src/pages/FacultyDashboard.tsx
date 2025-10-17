import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { StatsCard } from "@/components/analytics/StatsCard";
import { StatusDistribution } from "@/components/analytics/StatusDistribution";
import { CheckCircle, Clock, TrendingUp, LogOut, AlertCircle, FileText } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export default function FacultyDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, "pending" | "in_progress" | "completed" | "issued">>({});

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("department")
        .eq("user_id", user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["complaints", profile?.department],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("department", profile?.department)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.department,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ complaintId, status }: { complaintId: string; status: "pending" | "in_progress" | "completed" | "issued" }) => {
      const { error } = await supabase
        .from("complaints")
        .update({ status })
        .eq("id", complaintId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Complaint status updated",
      });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = (complaintId: string) => {
    const status = selectedStatuses[complaintId];
    if (!status) {
      toast({
        title: "Error",
        description: "Please select a status",
        variant: "destructive",
      });
      return;
    }
    updateStatusMutation.mutate({ complaintId, status });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      in_progress: "secondary",
      completed: "default",
      issued: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ")}</Badge>;
  };

  const statuses = [
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "issued", label: "Issued" },
  ];

  const stats = {
    total: complaints?.length || 0,
    pending: complaints?.filter(c => c.status === "pending").length || 0,
    inProgress: complaints?.filter(c => c.status === "in_progress").length || 0,
    completed: complaints?.filter(c => c.status === "completed").length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Faculty Dashboard</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button onClick={signOut} variant="ghost" size="sm"><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Your Department</CardTitle>
            <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {profile?.department || "Loading..."}
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Assigned" value={stats.total} icon={FileText} className="hover:scale-105 transition-transform" />
          <StatsCard title="Pending" value={stats.pending} icon={Clock} className="hover:scale-105 transition-transform" />
          <StatsCard title="In Progress" value={stats.inProgress} icon={TrendingUp} className="hover:scale-105 transition-transform" />
          <StatsCard title="Completed" value={stats.completed} icon={CheckCircle} className="hover:scale-105 transition-transform" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {complaints && <StatusDistribution complaints={complaints} />}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/10 flex items-center justify-between">
                <span className="text-sm">High Priority Issues</span>
                <Badge variant="destructive">{complaints?.filter(c => c.priority === 'high' || c.priority === 'critical').length || 0}</Badge>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10 flex items-center justify-between">
                <span className="text-sm">Requires Attention</span>
                <Badge variant="secondary">{stats.pending}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card shadow-glow">
          <CardHeader>
            <CardTitle>Department Complaints</CardTitle>
            <CardDescription>Manage and update complaint statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : complaints && complaints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Update Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select
                          value={selectedStatuses[complaint.id] || complaint.status}
                          onValueChange={(value: "pending" | "in_progress" | "completed" | "issued") => 
                            setSelectedStatuses(prev => ({ ...prev, [complaint.id]: value }))
                          }
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(complaint.id)}
                          disabled={updateStatusMutation.isPending}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No complaints assigned to your department</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
