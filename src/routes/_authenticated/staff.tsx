import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { lookupsQuery } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff directory · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Directory of NCAA officers with User ID, rank, directorate and travel document status.",
      },
      { property: "og:title", content: "Staff directory · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Search NCAA officers by name, User ID or directorate.",
      },
    ],
  }),
  component: StaffPage,
});

function StaffPage() {
  const { data: lookups } = useQuery(lookupsQuery());
  const [q, setQ] = useState("");

  const dirs = useMemo(
    () => new Map((lookups?.directorates ?? []).map((d) => [d.id, d.name])),
    [lookups],
  );
  const deps = useMemo(
    () => new Map((lookups?.departments ?? []).map((d) => [d.id, d.name])),
    [lookups],
  );

  const rows = (lookups?.staff ?? []).filter((s) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [s.full_name, s.staff_id_number, s.official_email ?? "", s.rank_title ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(t);
  });

  return (
    <>
      <PageHeader
        title="Staff directory"
        subtitle="Officers on record with the Protocol Unit, with User IDs and travel document status."
      />

      <Input
        placeholder="Search name, User ID, email…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full sm:max-w-xs"
      />

      {rows.length === 0 ? (
        <EmptyState title="No officers match that search" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Rank / title</TableHead>
                <TableHead>Directorate</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Official email</TableHead>
                <TableHead>Passport expiry</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="ref-no text-xs">{s.staff_id_number}</TableCell>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{s.rank_title ?? "—"}</TableCell>
                  <TableCell>{s.directorate_id ? (dirs.get(s.directorate_id) ?? "—") : "—"}</TableCell>
                  <TableCell>{s.department_id ? (deps.get(s.department_id) ?? "—") : "—"}</TableCell>
                  <TableCell>{s.official_email ?? "—"}</TableCell>
                  <TableCell>{s.passport_expiry ? shortDate(s.passport_expiry) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
