import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Plane, ReceiptText, Stamp, Hotel } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { NCAA_LOGO_URL } from "@/lib/assets";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NCAA Protocol Desk · Official Travel & Logistics Portal" },
      {
        name: "description",
        content:
          "Internal NCAA portal for official travel: ticket requests, ticket and visa refunds, introduction letters and DGCA logistics, managed by the Protocol Unit.",
      },
      { property: "og:title", content: "NCAA Protocol Desk" },
      {
        property: "og:description",
        content:
          "Official travel, visa, ticket and logistics desk for NCAA staff and the Protocol Unit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const SERVICES = [
  {
    icon: Plane,
    title: "Ticket requests",
    body: "Raise domestic and international ticket requests against an approved duty tour, tracked to issuance.",
  },
  {
    icon: ReceiptText,
    title: "Ticket & visa refunds",
    body: "Claim personally defrayed ticket and visa costs with receipts, review notes and payment recommendation.",
  },
  {
    icon: Stamp,
    title: "Introduction letters",
    body: "Generate referenced embassy introduction letters from Protocol Unit templates.",
  },
  {
    icon: Hotel,
    title: "Logistics",
    body: "Coordinate hotels, transport, halls and meet-and-assist for DGCA movements and delegations.",
  },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src={NCAA_LOGO_URL}
              alt="Nigeria Civil Aviation Authority coat of arms"
              className="h-11 w-11 object-contain"
            />
            <div className="leading-tight">
              <p className="font-serif text-base font-semibold">NCAA Protocol Desk</p>
              <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                Nigeria Civil Aviation Authority
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Staff sign-in</Link>
          </Button>
        </div>
      </header>

      <section className="border-b border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs tracking-[0.2em] text-sidebar-primary uppercase">
            Office of the Director-General of Civil Aviation
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight sm:text-5xl">
            Official travel, visa, ticket and logistics desk
          </h1>
          <p className="mt-5 max-w-2xl text-sm text-sidebar-foreground/80 sm:text-base">
            A single registry for every request handled by the NCAA Protocol Unit — from
            approval to memo, agency instruction, ticket issuance and closure.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary">
              <Link to="/auth">
                Enter the portal <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-serif text-2xl">What the desk handles</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <article key={s.title} className="rounded-lg border border-border bg-card p-5">
              <s.icon className="h-6 w-6 text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-6 text-xs text-muted-foreground">
          Authorised NCAA personnel only. All activity on this portal is logged for audit.
        </p>
      </footer>
    </div>
  );
}
