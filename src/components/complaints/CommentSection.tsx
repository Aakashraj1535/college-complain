import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface CommentSectionProps {
  complaintId: string;
}

export const CommentSection = ({ complaintId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", complaintId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_comments")
        .select(`
          *,
          profiles:user_id (name, user_id)
        `)
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${complaintId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaint_comments",
          filter: `complaint_id=eq.${complaintId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", complaintId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [complaintId, queryClient]);

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const { error } = await supabase.from("complaint_comments").insert({
        complaint_id: complaintId,
        user_id: user?.id,
        comment: commentText,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      toast({ title: "Comment added successfully" });
      queryClient.invalidateQueries({ queryKey: ["comments", complaintId] });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    addCommentMutation.mutate(comment);
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold text-lg">Discussion</h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">No comments yet. Start the discussion!</p>
        ) : (
          comments.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {c.profiles?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{c.profiles?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1">{c.comment}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[60px]"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!comment.trim() || addCommentMutation.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};
