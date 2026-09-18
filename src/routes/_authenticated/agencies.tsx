import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { lookupsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/agencies")({
  head: () => ({
    meta: [
      { title: "Travel agencies · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Registered travel agencies used by the NCAA Protocol Unit for ticket issuance and travel logistics.",
      },
      { property: "og:title", content: "Travel agencies · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Manage the agencies approved to issue NCAA official tickets.",
      },
    ],
  }),
  component: AgenciesPage,
});

function AgenciesPage() {
  const qc = useQueryClient();
  const { data: lookups } = useQuery(lookupsQuery());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  async function save() {
    if (!form.name.trim()) {
      toast.error("Agency name is required.");
      return;
    }
    const { error } = await supabase.from("travel_agencies").insert({
      name: form.name,
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      notes: form.notes || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agency registered.");
    setOpen(false);
    setForm({ name: "", contact_person: "", phone: "", email: "", address: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["lookups"] });
  }

  const agencies = lookups?.agencies ?? [];

  return (
    <>
      <PageHeader
        title="Travel agencies"
        subtitle="Agencies registered to issue official NCAA tickets and travel services."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Register agency</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register travel agency</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                {(
                  [
                    ["name", "Agency name"],
                    ["contact_person", "Contact person"],
                    ["phone", "Phone"],
                    ["email", "Email"],
                    ["address", "Address"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="grid gap-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="grid gap-1.5">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={save}>Save agency</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {agencies.length === 0 ? (
        <EmptyState title="No agencies registered yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="font-serif text-base">{a.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{a.contact_person ?? "No named contact"}</p>
                <p>{a.phone ?? "—"}</p>
                <p>{a.email ?? "—"}</p>
                <p>{a.address ?? "—"}</p>
                {a.notes ? <p className="pt-2 text-xs">{a.notes}</p> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
