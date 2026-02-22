
-- 1. Add unique constraint on subject code (per branch)
ALTER TABLE public.subjects ADD CONSTRAINT subjects_code_branch_unique UNIQUE (code, branch_id);

-- 2. Create update_requests table for faculty collaboration
CREATE TABLE public.update_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.update_requests ENABLE ROW LEVEL SECURITY;

-- Requester can view their own requests
CREATE POLICY "Requester can view own requests"
ON public.update_requests FOR SELECT
USING (requester_id = auth.uid());

-- Owner can view requests sent to them
CREATE POLICY "Owner can view received requests"
ON public.update_requests FOR SELECT
USING (owner_id = auth.uid());

-- Faculty can create requests
CREATE POLICY "Faculty can create requests"
ON public.update_requests FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'faculty'::app_role)
  AND requester_id = auth.uid()
);

-- Owner can update request status
CREATE POLICY "Owner can update request status"
ON public.update_requests FOR UPDATE
USING (owner_id = auth.uid());

-- Requester can delete own pending requests
CREATE POLICY "Requester can delete own pending requests"
ON public.update_requests FOR DELETE
USING (requester_id = auth.uid() AND status = 'pending');
