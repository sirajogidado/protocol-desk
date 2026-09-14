
CREATE OR REPLACE FUNCTION public.storage_object_request_id(_name text)
RETURNS uuid LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE v uuid;
BEGIN
  BEGIN v := split_part(_name,'/',2)::uuid; EXCEPTION WHEN others THEN RETURN NULL; END;
  RETURN v;
END; $$;
REVOKE EXECUTE ON FUNCTION public.storage_object_request_id(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.storage_object_request_id(text) TO authenticated;

CREATE POLICY "protocol docs read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'protocol-documents'
  AND public.can_see_request(auth.uid(), public.storage_object_request_id(name)));

CREATE POLICY "protocol docs insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'protocol-documents'
  AND public.can_see_request(auth.uid(), public.storage_object_request_id(name)));

CREATE POLICY "protocol docs delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'protocol-documents' AND public.is_protocol(auth.uid()));
