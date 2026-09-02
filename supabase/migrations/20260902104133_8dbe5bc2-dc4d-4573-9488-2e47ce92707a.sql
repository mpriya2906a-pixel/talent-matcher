-- Job Descriptions
CREATE TABLE public.job_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  company text,
  raw_text text NOT NULL,
  role_summary text,
  required_skills text[] NOT NULL DEFAULT '{}',
  preferred_skills text[] NOT NULL DEFAULT '{}',
  min_experience_years numeric,
  education_requirement text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_descriptions TO authenticated;
GRANT ALL ON public.job_descriptions TO service_role;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own job descriptions"
  ON public.job_descriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Candidates
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_description_id uuid NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text,
  email text,
  phone text,
  file_path text NOT NULL,
  file_name text,
  raw_text text,
  parsed_skills text[] NOT NULL DEFAULT '{}',
  parsed_education jsonb,
  parsed_experience jsonb,
  total_experience_years numeric,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','analyzed','shortlisted','rejected','failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own candidates"
  ON public.candidates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX candidates_job_description_id_idx ON public.candidates (job_description_id);

-- Match Results
CREATE TABLE public.match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  job_description_id uuid NOT NULL REFERENCES public.job_descriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overall_score numeric NOT NULL,
  keyword_score numeric,
  semantic_score numeric,
  matched_skills text[] NOT NULL DEFAULT '{}',
  missing_skills text[] NOT NULL DEFAULT '{}',
  ai_summary text,
  strengths text,
  concerns text,
  rank int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, job_description_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_results TO authenticated;
GRANT ALL ON public.match_results TO service_role;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own match results"
  ON public.match_results FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX match_results_job_description_id_idx ON public.match_results (job_description_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_match_results_updated_at BEFORE UPDATE ON public.match_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for the private "resumes" bucket (bucket created separately)
CREATE POLICY "Users read their own resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes' AND owner = auth.uid());

CREATE POLICY "Users upload their own resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND owner = auth.uid());

CREATE POLICY "Users delete their own resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes' AND owner = auth.uid());
