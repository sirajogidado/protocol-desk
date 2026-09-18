import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ROLE_LABEL } from "@/lib/domain";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile · NCAA Protocol Desk" },
      {
        name: "description",
        content: "Your NCAA personnel record: User ID, rank, directorate and department.",
      },
      { property: "og:title", content: "My profile · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "View your NCAA Protocol Desk personnel details.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: me } = useCurrentUser();

  const fields: [string, string][] = [
    ["Full name", me?.fullName ?? "—"],
    ["User ID", me?.staffIdNumber ?? "—"],
    ["Official email", me?.email ?? "—"],
    ["Rank / title", me?.rankTitle ?? "—"],
    ["Directorate", me?.directorate ?? "—"],
    ["Department", me?.department ?? "—"],
    ["Role", ROLE_LABEL[me?.primaryRole ?? "staff"]],
  ];

  return (
    <>
      <PageHeader title="My profile" subtitle="Your personnel record as held by the Protocol Unit." />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="font-serif text-base">Personnel details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 text-sm text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-muted-foreground">
            Corrections to your User ID, directorate or department are made by an Administrator.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
