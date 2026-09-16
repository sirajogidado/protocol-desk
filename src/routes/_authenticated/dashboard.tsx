import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { lookupsQuery, requestsQuery } from "@/lib/queries";
import { REQUEST_TYPE_LABEL, type RequestType } from "@/lib/domain";
import { naira, shortDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Live view of NCAA Protocol Desk case files, approvals awaiting action and upcoming official movements.",
      },
      { property: "og:title", content: "Dashboard · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Case files, approvals and movements for the NCAA Protocol Unit.",
      },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-2 font-serif text-3xl">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: me } = useCurrentUser();
  const { data: requests = [] } = useQuery(requestsQuery());
  const { data: lookups } = useQuery(lookupsQuery());

  const staffById = new Map((lookups?.staff ?? []).map((s) => [s.id, s]));
  const open = requests.filter((r) => !["closed", "rejected"].includes(r.status));
  const awaitingApproval = requests.filter((r) => r.status === "awaiting_approval");
  const mine = requests.filter((r) => r.requester_staff_id === me?.staffRecordId);
  const assigned = requests.filter((r) => r.assigned_officer_id === me?.id);
  const movements = requests
    .filter((r) => r.trip_start && new Date(r.trip_start) >= new Date())
    .sort((a, b) => (a.trip_start ?? "").localeCompare(b.trip_start ?? ""))
    .slice(0, 5);

  const list = me?.isProtocol || me?.isApprover ? open : mine;

  return (
    <>
      <PageHeader
        title={`Good day, ${me?.fullName?.split(" ")[0] ?? "colleague"}`}
        subtitle="Official travel, visa, ticket and logistics activity for the Protocol Unit."
        actions={
          <Button asChild>
            <Link to="/requests/new">New request</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {me?.isProtocol ? (
          <>
            <Stat label="Open case files" value={String(open.length)} />
            <Stat label="Awaiting approval" value={String(awaitingApproval.length)} />
            <Stat label="Assigned to me" value={String(assigned.length)} />
            <Stat
              label="Registered agencies"
              value={String(lookups?.agencies.length ?? 0)}
            />
          </>
        ) : me?.isApprover ? (
          <>
            <Stat label="Pending approvals" value={String(awaitingApproval.length)} />
            <Stat label="Decided case files" value={String(requests.length - awaitingApproval.length)} />
            <Stat label="My own requests" value={String(mine.length)} />
            <Stat label="Open across desk" value={String(open.length)} />
          </>
        ) : (
          <>
            <Stat label="My open requests" value={String(mine.filter((r) => !["closed", "rejected"].includes(r.status)).length)} />
            <Stat label="Documents to download" value={String(mine.filter((r) => r.status === "ticket_issued").length)} />
            <Stat label="Awaiting my documents" value={String(mine.filter((r) => r.status === "documents_pending").length)} />
            <Stat label="Total raised" value={String(mine.length)} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {me?.isProtocol ? "Protocol queue" : me?.isApprover ? "Awaiting your decision" : "My requests"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {list.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing here yet.
              </p>
            ) : (
              list.slice(0, 8).map((r) => (
                <Link
                  key={r.id}
                  to="/requests/$id"
                  params={{ id: r.id }}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2.5 transition-colors hover:bg-accent/60"
                >
                  <div className="min-w-0">
                    <p className="ref-no text-xs text-muted-foreground">{r.reference_no}</p>
                    <p className="truncate text-sm font-medium">
                      {REQUEST_TYPE_LABEL[r.type as RequestType]} —{" "}
                      {staffById.get(r.requester_staff_id)?.full_name ?? "Staff"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {naira(r.amount_requested)}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming movements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No travel scheduled.</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="border-l-2 border-primary/40 pl-3">
                  <p className="text-sm font-medium">{m.destination ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {shortDate(m.trip_start)} · {REQUEST_TYPE_LABEL[m.type as RequestType]}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
