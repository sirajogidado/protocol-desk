import { createFileRoute } from "@tanstack/react-router";

type Seed = {
  email: string;
  staff: string;
  role: string;
  name: string;
  rank: string;
  dcode: string;
  dept: string;
};

const USERS: Seed[] = [
  {
    email: "protocol@ncaa.gov.ng",
    staff: "NCAA/P.0001",
    role: "admin",
    name: "Protocol Administrator",
    rank: "Principal Protocol Officer",
    dcode: "ODGCA",
    dept: "Protocol Unit",
  },
  {
    email: "head.protocol@ncaa.gov.ng",
    staff: "NCAA/P.0002",
    role: "protocol_head",
    name: "Head, Protocol Unit",
    rank: "Assistant General Manager",
    dcode: "ODGCA",
    dept: "Protocol Unit",
  },
  {
    email: "officer@ncaa.gov.ng",
    staff: "NCAA/P.0003",
    role: "protocol_officer",
    name: "Protocol Officer",
    rank: "Senior Protocol Officer",
    dcode: "ODGCA",
    dept: "Protocol Unit",
  },
  {
    email: "approver@ncaa.gov.ng",
    staff: "NCAA/P.0004",
    role: "approver",
    name: "DGCA Approving Officer",
    rank: "Special Assistant to the DGCA",
    dcode: "ODGCA",
    dept: "Office Administration",
  },
  {
    email: "staff@ncaa.gov.ng",
    staff: "NCAA/P.0142",
    role: "staff",
    name: "Sample Staff Officer",
    rank: "Airworthiness Inspector",
    dcode: "DAWS",
    dept: "Aircraft Certification",
  },
];

export const Route = createFileRoute("/api/public/bootstrap")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const log: string[] = [];

        const { data: dirs } = await supabaseAdmin.from("directorates").select("id, code");
        const { data: deps } = await supabaseAdmin.from("departments").select("id, name");
        const dirBy = (c: string) => dirs?.find((d) => d.code === c)?.id ?? null;
        const depBy = (n: string) => deps?.find((d) => d.name === n)?.id ?? null;

        const ids: Record<string, string> = {};
        const staffIds: Record<string, string> = {};

        for (const u of USERS) {
          let userId: string | undefined;
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: u.email,
            password: "123456",
            email_confirm: true,
            user_metadata: { full_name: u.name },
          });
          if (error) {
            const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
            userId = list?.users.find((x) => x.email === u.email)?.id;
            log.push(`existing ${u.email}`);
          } else {
            userId = created.user?.id;
            log.push(`created ${u.email}`);
          }
          if (!userId) continue;
          ids[u.email] = userId;

          await supabaseAdmin.from("profiles").upsert(
            {
              id: userId,
              staff_id_number: u.staff,
              full_name: u.name,
              official_email: u.email,
              rank_title: u.rank,
              directorate_id: dirBy(u.dcode),
              department_id: depBy(u.dept),
              role: u.role,
              is_active: true,
            },
            { onConflict: "id" },
          );
          await supabaseAdmin
            .from("user_roles")
            .upsert({ user_id: userId, role: u.role }, { onConflict: "user_id,role" });

          const { data: sr } = await supabaseAdmin
            .from("staff_records")
            .upsert(
              {
                user_id: userId,
                staff_id_number: u.staff,
                full_name: u.name,
                rank_title: u.rank,
                official_email: u.email,
                directorate_id: dirBy(u.dcode),
                department_id: depBy(u.dept),
                nationality: "Nigerian",
                passport_number: u.staff === "NCAA/P.0142" ? "A50291883" : null,
                passport_expiry: u.staff === "NCAA/P.0142" ? "2029-04-18" : null,
                bank_name: "Zenith Bank Plc",
                account_name: u.name,
                account_number: "10" + u.staff.slice(-4) + "45678",
              },
              { onConflict: "staff_id_number" },
            )
            .select("id")
            .single();
          if (sr) staffIds[u.staff] = sr.id;
        }

        const officer = ids["officer@ncaa.gov.ng"];
        const staffRec = staffIds["NCAA/P.0142"];
        const adminRec = staffIds["NCAA/P.0001"];

        const { count } = await supabaseAdmin
          .from("requests")
          .select("id", { count: "exact", head: true });

        if (!count && staffRec) {
          const daws = dirBy("DAWS");
          const dawsDept = depBy("Aircraft Certification");
          const odgca = dirBy("ODGCA");
          const { data: agencies } = await supabaseAdmin
            .from("travel_agencies")
            .select("id, name");
          const agencyA = agencies?.[0]?.id ?? null;

          const rows = [
            {
              reference_no: "NCAA/PRT/TKT/2026/00041",
              type: "ticket",
              status: "with_agency",
              requester_staff_id: staffRec,
              directorate_id: daws,
              department_id: dawsDept,
              purpose: "ICAO Airworthiness Panel Meeting",
              destination: "Montreal, Canada",
              origin_city: "Abuja",
              trip_start: "2026-10-06",
              trip_end: "2026-10-16",
              travel_scope: "international",
              principal_type: "staff",
              assigned_officer_id: officer,
              agency_id: agencyA,
              amount_requested: 3850000,
              amount_approved: 3850000,
            },
            {
              reference_no: "NCAA/PRT/TKT/2026/00042",
              type: "ticket",
              status: "awaiting_approval",
              requester_staff_id: staffRec,
              directorate_id: daws,
              department_id: dawsDept,
              purpose: "Aerodrome safety audit, Port Harcourt",
              destination: "Port Harcourt",
              origin_city: "Lagos",
              trip_start: "2026-09-28",
              trip_end: "2026-10-02",
              travel_scope: "domestic",
              principal_type: "staff",
              amount_requested: 285000,
            },
            {
              reference_no: "NCAA/PRT/TRF/2026/00013",
              type: "ticket_refund",
              status: "under_review",
              requester_staff_id: staffRec,
              directorate_id: daws,
              department_id: dawsDept,
              purpose: "Self-purchased ticket for approved duty tour",
              destination: "Kano",
              trip_start: "2026-08-11",
              trip_end: "2026-08-15",
              travel_scope: "domestic",
              principal_type: "staff",
              assigned_officer_id: officer,
              amount_requested: 196500,
            },
            {
              reference_no: "NCAA/PRT/VRF/2026/00007",
              type: "visa_refund",
              status: "memo_raised",
              requester_staff_id: staffRec,
              directorate_id: daws,
              department_id: dawsDept,
              purpose: "Schengen visa fee personally defrayed",
              destination: "Embassy of France, Abuja",
              trip_start: "2026-07-02",
              trip_end: "2026-07-12",
              travel_scope: "international",
              principal_type: "staff",
              assigned_officer_id: officer,
              amount_requested: 142000,
            },
            {
              reference_no: "NCAA/PRT/INT/2026/00021",
              type: "intro_letter",
              status: "approved",
              requester_staff_id: staffRec,
              directorate_id: daws,
              department_id: dawsDept,
              purpose: "Visa application for ICAO panel meeting",
              destination: "High Commission of Canada, Abuja",
              trip_start: "2026-10-06",
              trip_end: "2026-10-16",
              travel_scope: "international",
              principal_type: "staff",
              assigned_officer_id: officer,
            },
            {
              reference_no: "NCAA/PRT/LOG/2026/00009",
              type: "logistics",
              status: "documents_pending",
              requester_staff_id: adminRec,
              directorate_id: odgca,
              department_id: depBy("Protocol Unit"),
              purpose: "DGCA movement — National Aviation Stakeholders Forum",
              destination: "Abuja",
              trip_start: "2026-09-21",
              trip_end: "2026-09-23",
              principal_type: "dgca",
              assigned_officer_id: officer,
              amount_requested: 4200000,
            },
          ];

          const { data: inserted } = await supabaseAdmin
            .from("requests")
            .insert(rows)
            .select("id, reference_no, type");

          for (const r of inserted ?? []) {
            await supabaseAdmin.from("request_activity").insert({
              request_id: r.id,
              actor_name: "System",
              action: "Case file opened",
              detail: `Reference ${r.reference_no} created.`,
            });
            if (["NCAA/PRT/TKT/2026/00041", "NCAA/PRT/INT/2026/00021"].includes(r.reference_no)) {
              await supabaseAdmin.from("approvals").insert({
                request_id: r.id,
                approval_kind: "dgca",
                reference_no: "DGCA/APP/2026/" + r.reference_no.slice(-5),
                approved_on: "2026-09-01",
                approver_name: "DGCA Approving Officer",
                decision: "approved",
                comment: "Approved for official travel.",
              });
            }
            if (r.reference_no === "NCAA/PRT/TKT/2026/00042") {
              await supabaseAdmin
                .from("approvals")
                .insert({ request_id: r.id, approval_kind: "dgca", decision: "pending" });
            }
            if (r.type === "ticket_refund" || r.type === "visa_refund") {
              await supabaseAdmin.from("refunds").insert({
                request_id: r.id,
                refund_kind: r.type === "ticket_refund" ? "ticket" : "visa",
                claimed_amount: r.type === "ticket_refund" ? 196500 : 142000,
                bank_name: "Zenith Bank Plc",
                account_name: "Sample Staff Officer",
                account_number: "1014245678",
                status: "under_review",
              });
            }
            if (r.reference_no === "NCAA/PRT/LOG/2026/00009") {
              await supabaseAdmin.from("logistics_items").insert([
                {
                  request_id: r.id,
                  item_type: "hotel",
                  vendor_name: "Transcorp Hilton Abuja",
                  confirmation_no: "TH-884210",
                  location: "Abuja",
                  start_at: "2026-09-21T14:00:00+01:00",
                  end_at: "2026-09-23T12:00:00+01:00",
                  amount: 2400000,
                },
                {
                  request_id: r.id,
                  item_type: "transport",
                  vendor_name: "NCAA Transport Pool",
                  confirmation_no: "VEH-2291",
                  location: "Abuja",
                  amount: 450000,
                  notes: "Two SUVs with drivers for the duration of the forum.",
                },
              ]);
            }
          }
          log.push(`seeded ${inserted?.length ?? 0} requests`);
        }

        return Response.json({ ok: true, log });
      },
    },
  },
});
