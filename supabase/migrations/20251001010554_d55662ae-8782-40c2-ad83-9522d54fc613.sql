-- Create table for storing video annotations
CREATE TABLE IF NOT EXISTS public.evaluation_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES public.evaluations(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL,
  annotation_type TEXT NOT NULL CHECK (annotation_type IN ('drawing', 'voice', 'text')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluation_annotations ENABLE ROW LEVEL SECURITY;

-- Coaches can view annotations for their evaluations
CREATE POLICY "Coaches can view annotations for their evaluations"
ON public.evaluation_annotations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE evaluations.id = evaluation_annotations.evaluation_id
    AND evaluations.coach_id = auth.uid()
  )
);

-- Coaches can insert annotations for their evaluations
CREATE POLICY "Coaches can insert annotations for their evaluations"
ON public.evaluation_annotations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE evaluations.id = evaluation_annotations.evaluation_id
    AND evaluations.coach_id = auth.uid()
  )
);

-- Coaches can update their own annotations
CREATE POLICY "Coaches can update their own annotations"
ON public.evaluation_annotations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE evaluations.id = evaluation_annotations.evaluation_id
    AND evaluations.coach_id = auth.uid()
  )
);

-- Coaches can delete their own annotations
CREATE POLICY "Coaches can delete their own annotations"
ON public.evaluation_annotations
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations
    WHERE evaluations.id = evaluation_annotations.evaluation_id
    AND evaluations.coach_id = auth.uid()
  )
);

-- Athletes can view annotations for their evaluations
CREATE POLICY "Athletes can view annotations for their evaluations"
ON public.evaluation_annotations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evaluations e
    JOIN public.athletes a ON a.id = e.athlete_id
    WHERE e.id = evaluation_annotations.evaluation_id
    AND a.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_evaluation_annotations_updated_at
BEFORE UPDATE ON public.evaluation_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();