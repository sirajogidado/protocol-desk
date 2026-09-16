import { supabase } from "@/integrations/supabase/client";

export type Lookups = Awaited<ReturnType<ReturnType<typeof lookupsQuery>["queryFn"]>>;

export function lookupsQuery() {
  return {
    queryKey: ["lookups"] as const,
    staleTime: 120_000,
    queryFn: async () => {
      const [dirs, deps, agencies, templates, staff, profiles] = await Promise.all([
        supabase.from("directorates").select("*").order("name"),
        supabase.from("departments").select("*").order("name"),
        supabase.from("travel_agencies").select("*").order("name"),
        supabase.from("memo_templates").select("*").order("code"),
        supabase.from("staff_records").select("*").order("staff_id_number"),
        supabase.from("profiles").select("*").order("staff_id_number"),
      ]);
      return {
        directorates: dirs.data ?? [],
        departments: deps.data ?? [],
        agencies: agencies.data ?? [],
        templates: templates.data ?? [],
        staff: staff.data ?? [],
        profiles: profiles.data ?? [],
      };
    },
  };
}

export function requestsQuery() {
  return {
    queryKey: ["requests"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  };
}

export function requestQuery(id: string) {
  return {
    queryKey: ["request", id] as const,
    queryFn: async () => {
      const [req, docs, approvals, memos, tickets, refunds, logistics, activity] =
        await Promise.all([
          supabase.from("requests").select("*").eq("id", id).maybeSingle(),
          supabase.from("request_documents").select("*").eq("request_id", id),
          supabase.from("approvals").select("*").eq("request_id", id),
          supabase
            .from("generated_documents")
            .select("*")
            .eq("request_id", id)
            .order("created_at", { ascending: false }),
          supabase.from("tickets").select("*").eq("request_id", id),
          supabase.from("refunds").select("*").eq("request_id", id),
          supabase.from("logistics_items").select("*").eq("request_id", id),
          supabase
            .from("request_activity")
            .select("*")
            .eq("request_id", id)
            .order("created_at", { ascending: false }),
        ]);
      if (req.error) throw req.error;
      return {
        request: req.data,
        documents: docs.data ?? [],
        approvals: approvals.data ?? [],
        memos: memos.data ?? [],
        tickets: tickets.data ?? [],
        refunds: refunds.data ?? [],
        logistics: logistics.data ?? [],
        activity: activity.data ?? [],
      };
    },
  };
}

export function memosQuery() {
  return {
    queryKey: ["memos"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generated_documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  };
}

export function logisticsQuery() {
  return {
    queryKey: ["logistics"] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("logistics_items")
        .select("*")
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  };
}

export function notificationsQuery(userId: string | undefined) {
  return {
    queryKey: ["notifications", userId] as const,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  };
}

export function auditQuery() {
  return {
    queryKey: ["audit"] as const,
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  };
}

/** Append a case-file activity entry and an audit record. */
export async function logActivity(opts: {
  requestId: string;
  action: string;
  detail?: string;
  actorId?: string | null;
  actorName?: string | null;
}) {
  await supabase.from("request_activity").insert({
    request_id: opts.requestId,
    action: opts.action,
    detail: opts.detail ?? null,
    actor_id: opts.actorId ?? null,
    actor_name: opts.actorName ?? null,
  });
  await supabase.from("audit_logs").insert({
    actor_id: opts.actorId ?? null,
    action: opts.action,
    entity_type: "request",
    entity_id: opts.requestId,
    metadata: { detail: opts.detail ?? null },
  });
}

export async function notify(userId: string, title: string, body: string, link: string) {
  await supabase.from("notifications").insert({ user_id: userId, title, body, link });
}

export const DOCUMENT_BUCKET = "protocol-documents";

/** Storage keys must be requests/<request_id>/<file> for the access rules to apply. */
export function documentPath(requestId: string, fileName: string) {
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  return `requests/${requestId}/${Date.now()}_${safe}`;
}

export async function signedUrl(path: string) {
  const { data } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

export function renderTemplate(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) => vars[key] ?? `—`);
}
