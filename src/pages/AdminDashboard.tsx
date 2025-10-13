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

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDepartments, setSelectedDepartments] = useState<Record<string, string>>({});

  const { data: complaints, isLoading } = useQuery({
    queryKey: ["complaints"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const assignDepartmentMutation = useMutation({
    mutationFn: async ({ complaintId, department }: { complaintId: string; department: string }) => {
      const { error } = await supabase
        .from("complaints")
        .update({ 
          department,
          assigned_by: user?.id 
        })
        .eq("id", complaintId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Complaint assigned successfully",
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

  const handleAssign = (complaintId: string) => {
    const department = selectedDepartments[complaintId];
    if (!department) {
      toast({
        title: "Error",
        description: "Please select a department",
        variant: "destructive",
      });
      return;
    }
    assignDepartmentMutation.mutate({ complaintId, department });
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

  const departments = ["IT", "Maintenance", "Administration", "Security", "HR"];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={signOut} variant="outline">Sign Out</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
            <CardDescription>Assign complaints to departments</CardDescription>
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
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell className="font-medium">{complaint.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{complaint.description}</TableCell>
                      <TableCell>
                        {complaint.department ? (
                          complaint.department
                        ) : (
                          <Select
                            value={selectedDepartments[complaint.id] || ""}
                            onValueChange={(value) => 
                              setSelectedDepartments(prev => ({ ...prev, [complaint.id]: value }))
                            }
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Select dept" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(complaint.status)}</TableCell>
                      <TableCell>{new Date(complaint.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {!complaint.department && (
                          <Button
                            size="sm"
                            onClick={() => handleAssign(complaint.id)}
                            disabled={assignDepartmentMutation.isPending}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No complaints found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
