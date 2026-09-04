CREATE POLICY "Users update their own resumes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resumes' AND owner = auth.uid())
WITH CHECK (bucket_id = 'resumes' AND owner = auth.uid());