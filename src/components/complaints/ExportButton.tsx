import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import { format } from "date-fns";

interface ExportButtonProps {
  complaints: any[];
  filename?: string;
}

export const ExportButton = ({ complaints, filename = "complaints" }: ExportButtonProps) => {
  const exportToCSV = () => {
    if (complaints.length === 0) return;

    const headers = ["ID", "Title", "Category", "Priority", "Status", "Department", "Created At", "Student Name"];
    const rows = complaints.map(c => [
      c.id,
      c.title,
      c.category || "N/A",
      c.priority,
      c.status,
      c.department || "Unassigned",
      format(new Date(c.created_at), "yyyy-MM-dd HH:mm"),
      c.profiles?.name || "Anonymous"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const data = complaints.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      department: c.department,
      created_at: c.created_at,
      student_name: c.profiles?.name || "Anonymous",
      is_anonymous: c.is_anonymous
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
