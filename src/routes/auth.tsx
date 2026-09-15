import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { NCAA_LOGO_URL } from "@/lib/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Secure sign-in for NCAA staff and the Protocol Unit to manage official travel, tickets, visas and logistics.",
      },
      { property: "og:title", content: "Sign in · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Secure sign-in for NCAA staff and the Protocol Unit.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Sign-in failed", { description: error.message });
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-4">
          <img
            src={NCAA_LOGO_URL}
            alt="Nigeria Civil Aviation Authority coat of arms"
            className="h-14 w-14 object-contain"
          />
          <div>
            <p className="font-serif text-xl font-semibold">NCAA Protocol Desk</p>
            <p className="text-xs tracking-widest text-sidebar-foreground/70 uppercase">
              Office of the Director-General
            </p>
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="font-serif text-3xl leading-snug">
            One case file for every official journey.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/75">
            Tickets, ticket and visa refunds, introduction letters and DGCA logistics —
            raised, approved, documented and closed in a single registry with a full audit
            trail.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">
          Authorised NCAA personnel only. Activity on this portal is logged.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src={NCAA_LOGO_URL} alt="" className="h-11 w-11 object-contain" />
            <p className="font-serif text-lg font-semibold">NCAA Protocol Desk</p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Staff sign-in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your official NCAA email address.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Official email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ncaa.gov.ng"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-md border border-border bg-muted/60 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Demo accounts (password 123456)</p>
            <ul className="mt-2 space-y-1">
              <li>protocol@ncaa.gov.ng — Administrator</li>
              <li>head.protocol@ncaa.gov.ng — Head of Protocol</li>
              <li>officer@ncaa.gov.ng — Protocol Officer</li>
              <li>approver@ncaa.gov.ng — Approving Officer</li>
              <li>staff@ncaa.gov.ng — Staff</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
