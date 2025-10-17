-- Enable realtime for complaint_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_comments;

-- Add index for better performance on comments queries
CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON public.complaint_comments(complaint_id);

-- Add index for better performance on complaints queries
CREATE INDEX IF NOT EXISTS idx_complaints_title ON public.complaints USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_complaints_description ON public.complaints USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at DESC);

-- Add function to auto-assign department based on keywords
CREATE OR REPLACE FUNCTION public.suggest_department(complaint_title TEXT, complaint_description TEXT)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  combined_text TEXT;
BEGIN
  combined_text := LOWER(complaint_title || ' ' || complaint_description);
  
  -- Academic keywords
  IF combined_text ~ '(exam|grade|marks|professor|teacher|class|lecture|course|syllabus|assignment|test)' THEN
    RETURN 'Academic Affairs';
  END IF;
  
  -- Hostel/Accommodation keywords
  IF combined_text ~ '(hostel|room|bed|mess|food|canteen|accommodation|roommate|warden)' THEN
    RETURN 'Hostel & Accommodation';
  END IF;
  
  -- IT/Technical keywords
  IF combined_text ~ '(wifi|internet|computer|lab|software|network|portal|website|system|login|password)' THEN
    RETURN 'IT Services';
  END IF;
  
  -- Library keywords
  IF combined_text ~ '(library|book|journal|reading|study hall|librarian)' THEN
    RETURN 'Library Services';
  END IF;
  
  -- Transport keywords
  IF combined_text ~ '(bus|transport|vehicle|parking|shuttle)' THEN
    RETURN 'Transport';
  END IF;
  
  -- Sports keywords
  IF combined_text ~ '(sports|gym|ground|playground|equipment|fitness)' THEN
    RETURN 'Sports & Recreation';
  END IF;
  
  -- Medical keywords
  IF combined_text ~ '(health|medical|doctor|clinic|hospital|sick|medicine|first aid)' THEN
    RETURN 'Health Services';
  END IF;
  
  -- Facilities/Maintenance keywords
  IF combined_text ~ '(maintenance|repair|broken|electricity|water|plumbing|ac|fan|light|furniture)' THEN
    RETURN 'Facilities & Maintenance';
  END IF;
  
  -- Default to General if no match
  RETURN 'General';
END;
$$;