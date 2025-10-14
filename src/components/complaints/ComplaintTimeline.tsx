import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TimelineEvent {
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

interface ComplaintTimelineProps {
  history: TimelineEvent[];
}

export const ComplaintTimeline = ({ history }: ComplaintTimelineProps) => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((event, index) => (
            <div key={index} className="flex gap-4 relative">
              {index !== history.length - 1 && (
                <div className="absolute left-[7px] top-8 bottom-0 w-0.5 bg-border" />
              )}
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
              </div>
              <div className="flex-1 space-y-1 pb-4">
                <p className="text-sm font-medium">
                  {event.field_changed === "status" && "Status changed"}
                  {event.field_changed === "department" && "Department assigned"}
                  {event.field_changed === "priority" && "Priority updated"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {event.old_value && (
                    <>
                      <span className="px-2 py-0.5 bg-muted rounded">{event.old_value}</span>
                      <span>→</span>
                    </>
                  )}
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded font-medium">
                    {event.new_value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.changed_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No activity yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
