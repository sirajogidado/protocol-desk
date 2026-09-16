import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/integrations/supabase/client";
import {
  DOCUMENT_BUCKET,
  documentPath,
  logActivity,
  lookupsQuery,
} from "@/lib/queries";
import {
  DOC_TYPE_LABEL,
  REQUEST_TYPES,
  REQUEST_TYPE_LABEL,
  requiredDocsFor,
  type RequestType,
} from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/requests/new")({
  head: () => ({
    meta: [
      { title: "New request · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Raise a ticket request, ticket or visa refund, embassy introduction letter or logistics job with the NCAA Protocol Unit.",
      },
      { property: "og:title", content: "New request · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Three-step wizard: choose the request type, give details, attach documents.",
      },
    ],
  }),
  component: NewRequest,
});

function NewRequest() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const { data: lookups } = useQuery(lookupsQuery());

  const [step, setStep] = useState(1);
  const [type, setType] = useState<RequestType>("ticket");
  const [scope, setScope] = useState("domestic");
  const [principal, setPrincipal] = useState("staff");
  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("Abuja");
  const [purpose, setPurpose] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const required = requiredDocsFor(type, scope);

  const submit = useMutation({
    mutationFn: async () => {
      if (!me?.staffRecordId) {
        throw new Error("Your staff record is missing — contact the Protocol Unit.");
      }
      const { data: reference, error: refError } = await supabase.rpc("next_reference", {
        _type: type,
      });
      if (refError || !reference) throw refError ?? new Error("Could not allocate a reference.");

      const profile = (lookups?.profiles ?? []).find((p) => p.id === me.id);

      const { data: created, error } = await supabase
        .from("requests")
        .insert({
          reference_no: reference,
          type,
          status: "awaiting_approval",
          requester_staff_id: me.staffRecordId,
          directorate_id: profile?.directorate_id ?? null,
          department_id: profile?.department_id ?? null,
          purpose: purpose || null,
          destination: destination || null,
          origin_city: origin || null,
          trip_start: start || null,
          trip_end: end || null,
          travel_scope: type === "ticket" ? (scope as "domestic" | "international") : null,
          principal_type: principal as "staff" | "guest" | "dgca",
          amount_requested: amount ? Number(amount) : null,
          notes: notes || null,
          created_by: me.id,
          updated_by: me.id,
        })
        .select()
        .single();
      if (error) throw error;

      for (const file of files) {
        const path = documentPath(created.id, file.name);
        const up = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, file);
        if (!up.error) {
          await supabase.from("request_documents").insert({
            request_id: created.id,
            doc_type: "other",
            file_path: path,
            file_name: file.name,
            uploaded_by: me.id,
          });
        }
      }

      await logActivity({
        requestId: created.id,
        action: "Case file raised",
        detail: `${REQUEST_TYPE_LABEL[type]} submitted for approval`,
        actorId: me.id,
        actorName: me.fullName,
      });

      return created;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Case file raised", { description: created.reference_no });
      navigate({ to: "/requests/$id", params: { id: created.id } });
    },
    onError: (e: Error) => toast.error("Could not raise the request", { description: e.message }),
  });

  return (
    <>
      <PageHeader
        title="New request"
        subtitle="Work begins only once a DGCA or ministerial approval is on file."
      />

      <ol className="flex flex-wrap gap-2 text-xs">
        {["Type", "Details", "Documents"].map((label, i) => (
          <li
            key={label}
            className={`rounded-full border px-3 py-1 ${
              step === i + 1
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What do you need?</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {REQUEST_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-md border px-4 py-3 text-left transition-colors ${
                  type === t ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
                }`}
              >
                <p className="text-sm font-medium">{REQUEST_TYPE_LABEL[t]}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{REQUEST_TYPE_LABEL[type]} details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {type === "ticket" ? (
              <div className="space-y-2">
                <Label>Travel scope</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domestic">Domestic</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Principal</Label>
              <Select value={principal} onValueChange={setPrincipal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="guest">Official guest</SelectItem>
                  <SelectItem value="dgca">DGCA movement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origin city</Label>
              <Input id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination / embassy</Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Montréal, Canada"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start date</Label>
              <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End date</Label>
              <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount claimed / estimated (₦)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="ICAO Council session"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes for the Protocol Unit</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supporting documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-border bg-muted/50 p-4 text-sm">
              <p className="font-medium">Required for this request</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {required.map((d) => (
                  <li key={d}>{DOC_TYPE_LABEL[d] ?? d}</li>
                ))}
              </ul>
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:bg-accent/40">
              <Upload className="h-4 w-4" />
              Choose files to attach
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            {files.length ? (
              <ul className="space-y-1 text-sm">
                {files.map((f) => (
                  <li key={f.name} className="text-muted-foreground">
                    {f.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
        ) : (
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit request
          </Button>
        )}
      </div>
    </>
  );
}
