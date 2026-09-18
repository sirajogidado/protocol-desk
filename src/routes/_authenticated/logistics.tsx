import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { logisticsQuery, requestsQuery } from "@/lib/queries";
import { LOGISTICS_ITEM_LABEL } from "@/lib/domain";
import { naira, dateTime } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/logistics")({
  head: () => ({
    meta: [
      { title: "Logistics · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Hotels, ground transport, halls and meet-and-assist arrangements handled by the NCAA Protocol Unit.",
      },
      { property: "og:title", content: "Logistics · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Track vendors, confirmations and costs for official NCAA movements.",
      },
    ],
  }),
  component: LogisticsPage,
});

function LogisticsPage() {
  const { data: items = [] } = useQuery(logisticsQuery());
  const { data: requests = [] } = useQuery(requestsQuery());
  const refs = new Map(requests.map((r) => [r.id, r.reference_no]));

  return (
    <>
      <PageHeader
        title="Logistics"
        subtitle="Hotel, transport, hall and meet-and-assist arrangements across all case files."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No logistics arrangements recorded"
          description="Logistics items are added from within a case file."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case file</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Confirmation</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <Link
                      to="/requests/$id"
                      params={{ id: i.request_id }}
                      className="ref-no text-xs underline-offset-2 hover:underline"
                    >
                      {refs.get(i.request_id) ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{LOGISTICS_ITEM_LABEL[i.item_type] ?? i.item_type}</TableCell>
                  <TableCell>{i.vendor_name ?? "—"}</TableCell>
                  <TableCell>{i.location ?? "—"}</TableCell>
                  <TableCell className="ref-no text-xs">{i.confirmation_no ?? "—"}</TableCell>
                  <TableCell>{i.start_at ? dateTime(i.start_at) : "—"}</TableCell>
                  <TableCell>{i.end_at ? dateTime(i.end_at) : "—"}</TableCell>
                  <TableCell>{naira(i.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
