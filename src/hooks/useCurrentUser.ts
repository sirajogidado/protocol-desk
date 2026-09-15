import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  staffIdNumber: string | null;
  rankTitle: string | null;
  directorate: string | null;
  department: string | null;
  staffRecordId: string | null;
  roles: string[];
  primaryRole: string;
  isAdmin: boolean;
  isProtocol: boolean;
  isApprover: boolean;
};

export function currentUserQueryOptions() {
  return {
    queryKey: ["current-user"],
    staleTime: 60_000,
    queryFn: async (): Promise<CurrentUser | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;

      const [profileRes, rolesRes, staffRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*, directorates(name), departments(name)")
          .eq("id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("staff_records").select("id").eq("user_id", user.id).maybeSingle(),
      ]);

      const profile = profileRes.data as
        | (Record<string, unknown> & {
            full_name: string;
            staff_id_number: string;
            rank_title: string | null;
            role: string;
            directorates: { name: string } | null;
            departments: { name: string } | null;
          })
        | null;

      const roles = (rolesRes.data ?? []).map((r) => r.role as string);
      const primaryRole = roles[0] ?? profile?.role ?? "staff";

      return {
        id: user.id,
        email: user.email ?? "",
        fullName: profile?.full_name ?? user.email ?? "Unknown user",
        staffIdNumber: profile?.staff_id_number ?? null,
        rankTitle: profile?.rank_title ?? null,
        directorate: profile?.directorates?.name ?? null,
        department: profile?.departments?.name ?? null,
        staffRecordId: staffRes.data?.id ?? null,
        roles,
        primaryRole,
        isAdmin: roles.includes("admin"),
        isProtocol: roles.some((r) =>
          ["admin", "protocol_officer", "protocol_head"].includes(r),
        ),
        isApprover: roles.includes("approver"),
      };
    },
  };
}

export function useCurrentUser() {
  return useQuery(currentUserQueryOptions());
}
