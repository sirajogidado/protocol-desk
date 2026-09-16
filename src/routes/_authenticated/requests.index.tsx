import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { lookupsQuery, requestsQuery } from "@/lib/queries";
import {
  REQUEST_STATUSES,
  REQUEST_TYPES,
  REQUEST_TYPE_LABEL,
  STATUS_LABEL,
  type RequestStatus,
  type RequestType,
} from "@/lib/domain";
import { naira, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/requests/")({
  head: () => ({
    meta: [
      { title: "Case files · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Every NCAA Protocol Unit case file — tickets, refunds, introduction letters and logistics — with status, User ID and amounts.",
      },
      { property: "og:title", content: "Case files · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Search and filter Protocol Unit case files by type, status and directorate.",
      },
    ],
  }),
  component: RequestsPage,
});

type Row = {
  id: string;
  reference_no: string;
  type: string;
  status: string;
  staffName: string;
  staffId: string;
  directorate: string;
  destination: string;
  scope: string;
  amount: number | null;
  created_at: string;
};

function RequestsPage() {
  const navigate = useNavigate();
  const { data: requests = [], isLoading } = useQuery(requestsQuery());
  const { data: lookups } = useQuery(lookupsQuery());
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [directorate, setDirectorate] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  const rows = useMemo<Row[]>(() => {
    const staff = new Map((lookups?.staff ?? []).map((s) => [s.id, s]));
    const dirs = new Map((lookups?.directorates ?? []).map((d) => [d.id, d.name]));
    return requests
      .filter((r) => (type === "all" ? true : r.type === type))
      .filter((r) => (status === "all" ? true : r.status === status))
      .filter((r) => (directorate === "all" ? true : r.directorate_id === directorate))
      .map((r) => ({
        id: r.id,
        reference_no: r.reference_no,
        type: r.type,
        status: r.status,
        staffName: staff.get(r.requester_staff_id)?.full_name ?? "—",
        staffId: staff.get(r.requester_staff_id)?.staff_id_number ?? "—",
        directorate: r.directorate_id ? (dirs.get(r.directorate_id) ?? "—") : "—",
        destination: r.destination ?? "—",
        scope: r.travel_scope ?? "—",
        amount: r.amount_requested,
        created_at: r.created_at,
      }))
      .filter((r) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [r.reference_no, r.staffName, r.staffId, r.destination]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [requests, lookups, type, status, directorate, search]);

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "reference_no",
        header: "Reference",
        cell: ({ row }) => (
          <span className="ref-no text-xs">{row.original.reference_no}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => REQUEST_TYPE_LABEL[row.original.type as RequestType],
      },
      { accessorKey: "staffName", header: "Officer" },
      {
        accessorKey: "staffId",
        header: "User ID",
        cell: ({ row }) => <span className="ref-no text-xs">{row.original.staffId}</span>,
      },
      { accessorKey: "directorate", header: "Directorate" },
      { accessorKey: "destination", header: "Destination" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => naira(row.original.amount),
      },
      {
        accessorKey: "created_at",
        header: "Raised",
        cell: ({ row }) => shortDate(row.original.created_at),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Case files"
        subtitle="Every request handled by the Protocol Unit, from approval to closure."
        actions={
          <Button asChild>
            <Link to="/requests/new">New request</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search reference, officer, User ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-xs"
        />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {REQUEST_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {REQUEST_TYPE_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s as RequestStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={directorate} onValueChange={setDirectorate}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Directorate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All directorates</SelectItem>
            {(lookups?.directorates ?? []).map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {rows.length === 0 && !isLoading ? (
        <EmptyState
          title="No case files match"
          description="Adjust the filters, or raise a new request for an approved duty tour."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none whitespace-nowrap"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: "/requests/$id", params: { id: row.original.id } })
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
