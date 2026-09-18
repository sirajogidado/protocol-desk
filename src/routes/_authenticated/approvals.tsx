import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { lookupsQuery, requestsQuery } from "@/lib/queries";
import { REQUEST_TYPE_LABEL, type RequestType } from "@/lib/domain";
import { naira, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "Approvals · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Case files awaiting DGCA or ministerial approval before the Protocol Unit can begin processing.",
      },
      { property: "og:title", content: "Approvals · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Approve, query or reject pending NCAA Protocol Unit case files.",
      },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { data: requests = [] } = useQuery(requestsQuery());
  const { data: lookups } = useQuery(lookupsQuery());
  const staff = new Map((lookups?.staff ?? []).map((s) => [s.id, s]));

  const pending = requests.filter((r) => r.status === "awaiting_approval");
  const decided = requests.filter((r) =>
    ["approved", "rejected", "queried"].includes(r.status),
  );

  return (
    <>
      <PageHeader
        title="Approvals"
        subtitle="Nothing moves into processing until a DGCA or ministerial approval is on file."
      />

      <section className="space-y-3">
        <h2 className="font-serif text-lg">Awaiting your decision</h2>
        {pending.length === 0 ? (
          <EmptyState title="No case files are awaiting approval" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((r) => {
              const s = staff.get(r.requester_staff_id);
              return (
                <Card key={r.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div>
                      <CardTitle className="font-serif text-base">
                        {REQUEST_TYPE_LABEL[r.type as RequestType]}
                      </CardTitle>
                      <p className="ref-no mt-1 text-xs text-muted-foreground">
                        {r.reference_no}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p className="text-foreground">
                      {s?.full_name ?? "—"}{" "}
                      <span className="ref-no text-xs">({s?.staff_id_number ?? "—"})</span>
                    </p>
                    <p>{r.purpose ?? "No purpose recorded"}</p>
                    <p>
                      {r.destination ?? "—"} · {naira(r.amount_requested)} ·{" "}
                      {shortDate(r.created_at)}
                    </p>
                    <Button asChild size="sm" className="mt-2">
                      <Link to="/requests/$id" params={{ id: r.id }}>
                        Open case file
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg">Recently decided</h2>
        {decided.length === 0 ? (
          <EmptyState title="No decisions recorded yet" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {decided.slice(0, 15).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    to="/requests/$id"
                    params={{ id: r.id }}
                    className="ref-no text-xs underline-offset-2 hover:underline"
                  >
                    {r.reference_no}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">
                    {REQUEST_TYPE_LABEL[r.type as RequestType]} · {r.destination ?? "—"}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
