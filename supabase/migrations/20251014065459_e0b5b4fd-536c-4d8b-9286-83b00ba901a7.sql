-- Add priority enum
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Add new columns to complaints table
ALTER TABLE public.complaints
ADD COLUMN priority public.complaint_priority DEFAULT 'medium',
ADD COLUMN category TEXT,
ADD COLUMN assigned_to UUID,
ADD COLUMN estimated_completion TIMESTAMP WITH TIME ZONE,
ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reopen_count INTEGER DEFAULT 0,
ADD COLUMN feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
ADD COLUMN feedback_comment TEXT,
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Create complaint_comments table
CREATE TABLE public.complaint_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create complaint_history table
CREATE TABLE public.complaint_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for complaint_comments
CREATE POLICY "Users can view comments on their complaints"
ON public.complaint_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = complaint_comments.complaint_id
    AND (complaints.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'faculty'::app_role))
  )
);

CREATE POLICY "Users can create comments"
ON public.complaint_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for complaint_history
CREATE POLICY "Users can view history of their complaints"
ON public.complaint_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.complaints
    WHERE complaints.id = complaint_history.complaint_id
    AND (complaints.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'faculty'::app_role))
  )
);

CREATE POLICY "System can create history"
ON public.complaint_history FOR INSERT
WITH CHECK (true);

-- RLS policies for notifications
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for complaints table
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create indexes for better performance
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_department ON public.complaints(department);
CREATE INDEX idx_complaints_priority ON public.complaints(priority);
CREATE INDEX idx_complaints_student_id ON public.complaints(student_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, read);
CREATE INDEX idx_complaint_comments_complaint_id ON public.complaint_comments(complaint_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_message TEXT,
  p_complaint_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, message, complaint_id)
  VALUES (p_user_id, p_type, p_message, p_complaint_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger to log complaint status changes
CREATE OR REPLACE FUNCTION public.log_complaint_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.complaint_history (complaint_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'status', OLD.status::text, NEW.status::text, auth.uid());
    
    -- Notify student of status change
    PERFORM create_notification(
      NEW.student_id,
      'status_change',
      'Your complaint "' || NEW.title || '" status changed to ' || NEW.status,
      NEW.id
    );
  END IF;
  
  IF OLD.department IS DISTINCT FROM NEW.department THEN
    INSERT INTO public.complaint_history (complaint_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'department', OLD.department, NEW.department, auth.uid());
  END IF;
  
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.complaint_history (complaint_id, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.id, 'priority', OLD.priority::text, NEW.priority::text, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER complaint_changes_trigger
AFTER UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.log_complaint_changes();