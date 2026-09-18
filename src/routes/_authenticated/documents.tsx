import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { MemoPreview } from "@/components/MemoPreview";
import { memosQuery, requestsQuery } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [
      { title: "Memos & letters · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Every e-memo and embassy introduction letter issued by the NCAA Protocol Unit, with reference numbers.",
      },
      { property: "og:title", content: "Memos & letters · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Browse and print issued NCAA Protocol Unit memos and introduction letters.",
      },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { data: memos = [] } = useQuery(memosQuery());
  const { data: requests = [] } = useQuery(requestsQuery());
  const refs = new Map(requests.map((r) => [r.id, r.reference_no]));
  const [selected, setSelected] = useState<string | null>(null);

  const current = memos.find((m) => m.id === selected) ?? memos[0] ?? null;

  return (
    <>
      <PageHeader
        title="Memos & letters"
        subtitle="Issued e-memos and embassy introduction letters. Bodies are snapshots — template edits never rewrite them."
        actions={
          current ? (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          ) : null
        }
      />

      {memos.length === 0 ? (
        <EmptyState
          title="No documents issued yet"
          description="Memos and letters are generated from inside a case file."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <ul className="space-y-2 print:hidden">
            {memos.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => setSelected(m.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                    current?.id === m.id
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="ref-no text-xs">{m.reference_no}</span>
                    <Badge variant="secondary">
                      {m.doc_kind === "intro_letter" ? "Letter" : "Memo"}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm">{m.subject}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {shortDate(m.created_at)} ·{" "}
                    <Link
                      to="/requests/$id"
                      params={{ id: m.request_id }}
                      className="underline-offset-2 hover:underline"
                    >
                      {refs.get(m.request_id) ?? "case file"}
                    </Link>
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div>{current ? <MemoPreview doc={current} /> : null}</div>
        </div>
      )}
    </>
  );
}
