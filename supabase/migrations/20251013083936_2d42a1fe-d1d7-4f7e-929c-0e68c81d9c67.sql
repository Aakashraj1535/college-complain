-- Create complaint status enum
CREATE TYPE public.complaint_status AS ENUM ('pending', 'in_progress', 'completed', 'issued');

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT,
  status complaint_status NOT NULL DEFAULT 'pending',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaints
-- Students can insert their own complaints
CREATE POLICY "Students can create complaints"
ON public.complaints
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id AND has_role(auth.uid(), 'student'));

-- Students can view their own complaints
CREATE POLICY "Students can view their own complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all complaints (for assignment)
CREATE POLICY "Admins can update complaints"
ON public.complaints
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Faculty can view complaints for their department
CREATE POLICY "Faculty can view department complaints"
ON public.complaints
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'faculty') AND
  department = (SELECT department FROM public.profiles WHERE user_id = auth.uid())
);

-- Faculty can update complaints for their department
CREATE POLICY "Faculty can update department complaints"
ON public.complaints
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'faculty') AND
  department = (SELECT department FROM public.profiles WHERE user_id = auth.uid())
);

-- Add trigger for updated_at
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();