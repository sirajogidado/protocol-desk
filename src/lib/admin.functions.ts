import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF_ID = /^NCAA\/P\.\d{4,}$/;

const createUserSchema = z.object({
  staffIdNumber: z.string().regex(STAFF_ID, "User ID must look like NCAA/P.0123"),
  email: z.string().email(),
  fullName: z.string().min(2),
  rankTitle: z.string().optional().nullable(),
  directorateId: z.string().uuid().optional().nullable(),
  departmentId: z.string().uuid().optional().nullable(),
  role: z.enum(["admin", "protocol_officer", "protocol_head", "approver", "staff"]),
  password: z.string().min(6),
});

export const createStaffUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createUserSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only administrators can create user accounts.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [dupProfile, dupStaff] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id")
        .or(`staff_id_number.eq.${data.staffIdNumber},official_email.eq.${data.email}`)
        .maybeSingle(),
      supabaseAdmin
        .from("staff_records")
        .select("id")
        .eq("staff_id_number", data.staffIdNumber)
        .maybeSingle(),
    ]);
    if (dupProfile.data || dupStaff.data) {
      throw new Error("That User ID or official email is already in use.");
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Could not create the account.");
    }
    const userId = created.data.user.id;

    const profile = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      staff_id_number: data.staffIdNumber,
      full_name: data.fullName,
      official_email: data.email,
      rank_title: data.rankTitle ?? null,
      directorate_id: data.directorateId ?? null,
      department_id: data.departmentId ?? null,
      role: data.role,
      is_active: true,
    });
    if (profile.error) throw new Error(profile.error.message);

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: data.role }, { onConflict: "user_id,role" });

    await supabaseAdmin.from("staff_records").upsert(
      {
        user_id: userId,
        staff_id_number: data.staffIdNumber,
        full_name: data.fullName,
        official_email: data.email,
        rank_title: data.rankTitle ?? null,
        directorate_id: data.directorateId ?? null,
        department_id: data.departmentId ?? null,
        is_active: true,
      },
      { onConflict: "staff_id_number" },
    );

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "user.created",
      entity_type: "profile",
      entity_id: userId,
      metadata: { staff_id_number: data.staffIdNumber, role: data.role },
    });

    return { id: userId, staffIdNumber: data.staffIdNumber };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "protocol_officer", "protocol_head", "approver", "staff"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only administrators can change roles.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    await supabaseAdmin.from("profiles").update({ role: data.role }).eq("id", data.userId);
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "user.role_changed",
      entity_type: "profile",
      entity_id: data.userId,
      metadata: { role: data.role },
    });
    return { ok: true };
  });
