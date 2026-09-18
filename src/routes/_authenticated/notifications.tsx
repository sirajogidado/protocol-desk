import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { notificationsQuery } from "@/lib/queries";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/integrations/supabase/client";
import { dateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · NCAA Protocol Desk" },
      {
        name: "description",
        content: "Approvals, queries, assignments and ticket issuance alerts for your case files.",
      },
      { property: "og:title", content: "Notifications · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Your NCAA Protocol Desk alerts in one place.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(notificationsQuery(me?.id));

  async function markAllRead() {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Alerts raised when a case file is approved, queried, assigned or ticketed."
        actions={
          items.length ? (
            <Button variant="outline" onClick={markAllRead}>
              Mark all as read
            </Button>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState title="Nothing to read" description="You have no notifications yet." />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {items.map((n) => (
            <li key={n.id} className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className={n.is_read ? "text-sm" : "text-sm font-semibold"}>{n.title}</p>
                <span className="text-xs text-muted-foreground">{dateTime(n.created_at)}</span>
              </div>
              {n.body ? (
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
