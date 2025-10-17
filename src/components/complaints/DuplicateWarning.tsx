import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DuplicateWarningProps {
  title: string;
  description: string;
}

export const DuplicateWarning = ({ title, description }: DuplicateWarningProps) => {
  const { data: similarComplaints = [] } = useQuery({
    queryKey: ["similar-complaints", title, description],
    queryFn: async () => {
      if (!title || title.length < 3) return [];

      const { data, error } = await supabase
        .from("complaints")
        .select("id, title, status, created_at")
        .textSearch("title", title.split(" ").join(" | "))
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: title.length >= 3,
  });

  if (similarComplaints.length === 0) return null;

  return (
    <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertTitle>Similar complaints found</AlertTitle>
      <AlertDescription>
        <p className="mb-2 text-sm">We found similar complaints that might be related:</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {similarComplaints.map((complaint) => (
            <li key={complaint.id}>
              {complaint.title} - <span className="text-muted-foreground">
                {complaint.status} ({formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })})
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm">Consider checking these before submitting a new complaint.</p>
      </AlertDescription>
    </Alert>
  );
};
