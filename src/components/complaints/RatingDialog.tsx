import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface RatingDialogProps {
  complaintId: string;
  complaintTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RatingDialog = ({ complaintId, complaintTitle, open, onOpenChange }: RatingDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("complaints")
        .update({
          feedback_rating: rating,
          feedback_comment: feedbackComment,
        })
        .eq("id", complaintId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Thank you for your feedback!" });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onOpenChange(false);
      setRating(0);
      setFeedbackComment("");
    },
    onError: () => {
      toast({ title: "Failed to submit rating", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    submitRatingMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How satisfied are you with the resolution of: "{complaintTitle}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            placeholder="Any additional comments? (optional)"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            rows={4}
          />

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitRatingMutation.isPending}
            >
              Submit Rating
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
