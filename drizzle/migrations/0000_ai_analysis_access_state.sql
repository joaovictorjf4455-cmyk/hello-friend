CREATE TABLE public.ai_analysis_access_state (id text PRIMARY KEY, status integer NOT NULL DEFAULT 403, message text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.ai_analysis_access_state TO service_role;
ALTER TABLE public.ai_analysis_access_state ENABLE ROW LEVEL SECURITY;