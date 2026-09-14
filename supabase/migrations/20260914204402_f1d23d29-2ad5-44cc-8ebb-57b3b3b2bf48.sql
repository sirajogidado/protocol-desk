
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_protocol(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff_owner(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_see_request(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.next_reference(public.request_type) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.next_memo_reference(public.doc_kind) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_protocol(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_reference(public.request_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_memo_reference(public.doc_kind) TO authenticated;
