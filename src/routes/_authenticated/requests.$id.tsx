import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Download,
  FileText,
  Loader2,
  Printer,
  Upload,
} from "lucide-react";

import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { MemoPreview } from "@/components/MemoPreview";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { supabase } from "@/integrations/supabase/client";
import {
  DOCUMENT_BUCKET,
  documentPath,
  logActivity,
  lookupsQuery,
  notify,
  renderTemplate,
  requestQuery,
  signedUrl,
} from "@/lib/queries";
import {
  DOC_TYPE_LABEL,
  LOGISTICS_ITEM_LABEL,
  NEXT_STATUSES,
  REQUEST_TYPE_LABEL,
  requiredDocsFor,
  STATUS_LABEL,
  type RequestStatus,
  type RequestType,
} from "@/lib/domain";
import { dateRange, naira, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STEPPER: RequestStatus[] = [
  "draft",
  "awaiting_approval",
  "approved",
  "documents_pending",
  "memo_raised",
  "with_agency",
  "ticket_issued",
  "closed",
];

export const Route = createFileRoute("/_authenticated/requests/$id")({
  head: () => ({
    meta: [
      { title: "Case file · NCAA Protocol Desk" },
      {
        name: "description",
        content:
          "Full NCAA Protocol Unit case file: approval trail, staff travel pack, memos, agency and ticket details, logistics and activity.",
      },
      { property: "og:title", content: "Case file · NCAA Protocol Desk" },
      {
        property: "og:description",
        content: "Track and process a Protocol Unit case file end to end.",
      },
    ],
  }),
  component: CaseFile,
  errorComponent: ({ error }) => (
    <EmptyState title="This case file could not be opened" description={error.message} />
  ),
  notFoundComponent: () => <EmptyState title="Case file not found" />,
});

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value ?? "—"}</p>
    </div>
  );
}

function CaseFile() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const { data, isLoading } = useQuery(requestQuery(id));
  const { data: lookups } = useQuery(lookupsQuery());

  const request = data?.request;
  const isProtocol = me?.isProtocol ?? false;

  const staff = useMemo(
    () => (lookups?.staff ?? []).find((s) => s.id === request?.requester_staff_id),
    [lookups, request],
  );
  const agency = (lookups?.agencies ?? []).find((a) => a.id === request?.agency_id);
  const officer = (lookups?.profiles ?? []).find((p) => p.id === request?.assigned_officer_id);
  const directorate = (lookups?.directorates ?? []).find(
    (d) => d.id === request?.directorate_id,
  );
  const department = (lookups?.departments ?? []).find((d) => d.id === request?.department_id);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["request", id] });
    qc.invalidateQueries({ queryKey: ["requests"] });
  };

  /* ---------------- mutations ---------------- */

  const [statusValue, setStatusValue] = useState<string>("");
  const [statusReason, setStatusReason] = useState("");

  const changeStatus = useMutation({
    mutationFn: async ({ status, reason }: { status: string; reason: string }) => {
      const { error } = await supabase
        .from("requests")
        .update({ status: status as RequestStatus, updated_by: me?.id ?? null })
        .eq("id", id);
      if (error) throw error;
      await logActivity({
        requestId: id,
        action: `Status set to ${STATUS_LABEL[status as RequestStatus]}`,
        detail: reason || undefined,
        actorId: me?.id ?? null,
        actorName: me?.fullName ?? null,
      });
      if (staff?.user_id) {
        await notify(
          staff.user_id,
          `${request?.reference_no}: ${STATUS_LABEL[status as RequestStatus]}`,
          reason || "Your case file was updated by the Protocol Unit.",
          `/requests/${id}`,
        );
      }
    },
    onSuccess: () => {
      toast.success("Status updated");
      setStatusReason("");
      setStatusValue("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [assignOfficer, setAssignOfficer] = useState("");
  const [assignAgency, setAssignAgency] = useState("");

  const packComplete = Boolean(
    staff?.passport_number &&
      staff?.staff_id_number &&
      staff?.directorate_id &&
      staff?.department_id &&
      staff?.official_email &&
      staff?.phone &&
      staff?.passport_expiry &&
      staff?.nationality,
  );

  const assign = useMutation({
    mutationFn: async () => {
      const patch: Record<string, string | null> = { updated_by: me?.id ?? null };
      if (assignOfficer) patch['assigned_officer_id'] = assignOfficer;
      if (assignAgency) {
        if (!packComplete && !me?.roles.includes("protocol_head")) {
          throw new Error(
            "The staff travel pack is incomplete — only the Head of Protocol may assign an agency.",
          );
        }
        patch['agency_id'] = assignAgency;
      }
      const { error } = await supabase.from("requests").update(patch).eq("id", id);
      if (error) throw error;
      await logActivity({
        requestId: id,
        action: "Assignment updated",
        detail: [
          assignOfficer
            ? `Officer: ${(lookups?.profiles ?? []).find((p) => p.id === assignOfficer)?.full_name}`
            : null,
          assignAgency
            ? `Agency: ${(lookups?.agencies ?? []).find((a) => a.id === assignAgency)?.name}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        actorId: me?.id ?? null,
        actorName: me?.fullName ?? null,
      });
      if (assignOfficer) {
        await notify(
          assignOfficer,
          `Case file assigned: ${request?.reference_no}`,
          "You have been assigned as the processing officer.",
          `/requests/${id}`,
        );
      }
    },
    onSuccess: () => {
      toast.success("Assignment saved");
      setAssignOfficer("");
      setAssignAgency("");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* approval */
  const [appKind, setAppKind] = useState("dgca");
  const [appRef, setAppRef] = useState("");
  const [appDate, setAppDate] = useState("");
  const [appName, setAppName] = useState("");
  const [appDecision, setAppDecision] = useState("approved");
  const [appComment, setAppComment] = useState("");
  const [appFile, setAppFile] = useState<File | null>(null);

  const recordApproval = useMutation({
    mutationFn: async () => {
      let filePath: string | null = null;
      if (appFile) {
        const path = documentPath(id, appFile.name);
        const up = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, appFile);
        if (up.error) throw up.error;
        filePath = path;
        await supabase.from("request_documents").insert({
          request_id: id,
          doc_type: "approval_letter",
          file_path: path,
          file_name: appFile.name,
          uploaded_by: me?.id ?? null,
        });
      }
      const { error } = await supabase.from("approvals").insert({
        request_id: id,
        approval_kind: appKind as "dgca" | "ministerial",
        reference_no: appRef || null,
        approved_on: appDate || null,
        approver_name: appName || me?.fullName || null,
        decision: appDecision as "pending" | "approved" | "queried" | "rejected",
        comment: appComment || null,
        file_path: filePath,
        created_by: me?.id ?? null,
      });
      if (error) throw error;

      const nextStatus =
        appDecision === "approved"
          ? "approved"
          : appDecision === "queried"
            ? "queried"
            : appDecision === "rejected"
              ? "rejected"
              : null;
      if (nextStatus) {
        await supabase
          .from("requests")
          .update({ status: nextStatus as RequestStatus })
          .eq("id", id);
      }
      await logActivity({
        requestId: id,
        action: `Approval ${appDecision}`,
        detail: `${appKind.toUpperCase()} ${appRef}`.trim(),
        actorId: me?.id ?? null,
        actorName: me?.fullName ?? null,
      });
      if (staff?.user_id) {
        await notify(
          staff.user_id,
          `${request?.reference_no}: approval ${appDecision}`,
          appComment || "An approval decision was recorded on your case file.",
          `/requests/${id}`,
        );
      }
    },
    onSuccess: () => {
      toast.success("Approval recorded");
      setAppRef("");
      setAppDate("");
      setAppComment("");
      setAppFile(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* memo generation */
  const [templateId, setTemplateId] = useState("");
  const [signatory, setSignatory] = useState("");

  const generateMemo = useMutation({
    mutationFn: async () => {
      const template = (lookups?.templates ?? []).find((t) => t.id === templateId);
      if (!template) throw new Error("Choose a template first.");
      const kind = template.code === "INTRO_LETTER" ? "intro_letter" : "memo";
      const { data: reference, error: refErr } = await supabase.rpc("next_memo_reference", {
        _kind: kind,
      });
      if (refErr || !reference) throw refErr ?? new Error("Could not allocate a memo number.");

      const approval = (data?.approvals ?? []).find((a) => a.decision === "approved");
      const vars: Record<string, string> = {
        memo_ref: reference,
        date: shortDate(new Date().toISOString()),
        staff_name: staff?.full_name ?? "",
        staff_id: staff?.staff_id_number ?? "",
        rank: staff?.rank_title ?? "",
        directorate: directorate?.name ?? "",
        department: department?.name ?? "",
        destination: request?.destination ?? "",
        travel_dates: dateRange(request?.trip_start ?? null, request?.trip_end ?? null),
        purpose: request?.purpose ?? "",
        amount: request?.amount_requested ? naira(request.amount_requested) : "",
        approval_ref: approval?.reference_no ?? "",
        agency_name: agency?.name ?? "",
        passport_no: staff?.passport_number ?? "",
        dgca_name: "Director-General of Civil Aviation",
      };

      const { error } = await supabase.from("generated_documents").insert({
        request_id: id,
        template_id: template.id,
        doc_kind: kind as "memo" | "intro_letter",
        reference_no: reference,
        subject: renderTemplate(template.subject, vars),
        body_snapshot: renderTemplate(template.body, vars),
        signatory_name: signatory || me?.fullName || null,
        signatory_title: template.default_signatory ?? null,
        cc_list: template.default_cc ?? null,
        version: 1,
        status: "issued",
        created_by: me?.id ?? null,
        issued_at: new Date().toISOString(),
      });
      if (error) throw error;

      await supabase.from("requests").update({ status: "memo_raised" }).eq("id", id);
      await logActivity({
        requestId: id,
        action: "Memo issued",
        detail: `${reference} — ${template.title}`,
        actorId: me?.id ?? null,
        actorName: me?.fullName ?? null,
      });
      return reference;
    },
    onSuccess: (reference) => {
      toast.success("Memo issued", { description: String(reference) });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ticket */
  const [ticket, setTicket] = useState({
    airline: "",
    pnr: "",
    ticket_number: "",
    route: "",
    cabin_class: "Economy",
    depart_at: "",
    return_at: "",
    amount: "",
    invoice_no: "",
  });

  const recordTicket = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tickets").insert({
        request_id: id,
        agency_id: request?.agency_id ?? null,
        airline: ticket.airline || null,
        pnr: ticket.pnr || null,
        ticket_number: ticket.ticket_number || null,
        route: ticket.route || null,
        cabin_class: ticket.cabin_class || null,
        depart_at: ticket.depart_at ? new Date(ticket.depart_at).toISOString() : null,
        return_at: ticket.return_at ? new Date(ticket.return_at).toISOString() : null,
        amount: ticket.amount ? Number(ticket.amount) : null,
        invoice_no: ticket.invoice_no || null,
        created_by: me?.id ?? null,
      });
      if (error) throw error;
      await supabase
        .from("requests")
        .update({
          status: "ticket_issued",
          amount_approved: ticket.amount ? Number(ticket.amount) : null,
        })
        .eq("id", id);
      await logActivity({
        requestId: id,
        action: "Ticket issued",
        detail: `${ticket.airline} ${ticket.pnr} ${ticket.route}`.trim(),
        actorId: me?.id ?? null,
        actorName: me?.fullName ?? null,
      });
      if (staff?.user_id) {
        await notify(
          staff.user_id,
          `Ticket issued — ${request?.reference_no}`,
          `${ticket.airline} ${ticket.route}`.trim(),
          `/requests/${id}`,
        );
      }
    },
    onSuccess: () => {
      toast.success("Ticket recorded");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* documents */
  const [docType, setDocType] = useState("other");
  const [docFile, setDocFile] = useState<File | null>(null);

  const uploadDoc = useMutation({
    mutationFn: async () => {
      if (!docFile) throw new Error("Choose a file first.");
      const path = documentPath(id, docFile.name);
      const up = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, docFile);
      if (up.error) throw up.error;
      const { error } = await supabase.from("request_documents").insert({
        request_id: id,
        doc_type: docType as "other",
        file_path: path,
        file_name: docFile.name,
        uploaded_by: me?.id ?? null,
      });
      if (error) throw error;
      await logActivity({
        requestId: id,
        action: "Document uploaded",
        detail: `${DOC_TYPE_LABEL[docType]} — ${docFile.name}`,
        actorId: me?.id ?? null,
        actorName: me?.fullName ?? null,
      });
    },
    onSuccess: () => {
      toast.success("Document uploaded");
      setDocFile(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openDocument(path: string) {
    const url = await signedUrl(path);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("That file could not be opened.");
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Opening case file…
      </div>
    );
  }
  if (!request) {
    return <EmptyState title="Case file not found" />;
  }

  const required = requiredDocsFor(request.type as RequestType, request.travel_scope);
  const held = new Set((data?.documents ?? []).map((d) => d.doc_type));
  const stepIndex = STEPPER.indexOf(request.status as RequestStatus);

  return (
    <>
      <PageHeader
        title={REQUEST_TYPE_LABEL[request.type as RequestType]}
        subtitle={`${request.destination ?? "—"} · raised ${shortDate(request.created_at)}`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/requests">
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Case files
              </Link>
            </Button>
            <StatusBadge status={request.status} />
          </>
        }
      />

      <p className="ref-no text-sm text-muted-foreground">{request.reference_no}</p>

      {/* stepper */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg border border-border bg-card p-4">
        {STEPPER.map((s, i) => {
          const done = stepIndex >= 0 && i <= stepIndex;
          return (
            <div key={s} className="flex items-center gap-2">
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <CircleDashed className="h-4 w-4 text-muted-foreground/60" />
              )}
              <span
                className={done ? "text-xs font-medium" : "text-xs text-muted-foreground"}
              >
                {STATUS_LABEL[s]}
              </span>
              {i < STEPPER.length - 1 ? (
                <span className="text-muted-foreground/40">—</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="details">
          <TabsList className="flex-wrap">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="pack">Staff pack</TabsTrigger>
            <TabsTrigger value="memos">Memos &amp; letters</TabsTrigger>
            <TabsTrigger value="agency">Agency &amp; ticket</TabsTrigger>
            <TabsTrigger value="logistics">Logistics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                <Field label="Reference" value={<span className="ref-no">{request.reference_no}</span>} />
                <Field label="Type" value={REQUEST_TYPE_LABEL[request.type as RequestType]} />
                <Field label="Requester" value={staff?.full_name ?? "—"} />
                <Field label="User ID" value={<span className="ref-no">{staff?.staff_id_number ?? "—"}</span>} />
                <Field label="Directorate" value={directorate?.name ?? "—"} />
                <Field label="Department" value={department?.name ?? "—"} />
                <Field label="Origin" value={request.origin_city ?? "—"} />
                <Field label="Destination" value={request.destination ?? "—"} />
                <Field label="Travel dates" value={dateRange(request.trip_start, request.trip_end)} />
                <Field label="Scope" value={request.travel_scope ?? "—"} />
                <Field label="Principal" value={request.principal_type} />
                <Field label="Amount requested" value={naira(request.amount_requested)} />
                <div className="sm:col-span-2">
                  <Field label="Purpose" value={request.purpose ?? "—"} />
                </div>
                <div className="sm:col-span-2">
                  <Field label="Notes" value={request.notes ?? "—"} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Required documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {required.map((d) => (
                  <div key={d} className="flex items-center gap-2 text-sm">
                    {held.has(d as "other") ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-warning" />
                    )}
                    {DOC_TYPE_LABEL[d]}
                    <span className="text-xs text-muted-foreground">
                      {held.has(d as "other") ? "received" : "missing"}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.documents ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing attached yet.</p>
                ) : (
                  (data?.documents ?? []).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type} ·{" "}
                          {shortDate(doc.created_at)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openDocument(doc.file_path)}>
                        <Download className="mr-1.5 h-4 w-4" /> Open
                      </Button>
                    </div>
                  ))
                )}

                <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-[180px_1fr_auto]">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                        <SelectItem key={k} value={k}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="file"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    onClick={() => uploadDoc.mutate()}
                    disabled={uploadDoc.isPending || !docFile}
                  >
                    {uploadDoc.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-4 w-4" />
                    )}
                    Upload
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pack" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Staff travel pack</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" value={staff?.full_name ?? "—"} />
                <Field
                  label="User ID"
                  value={<span className="ref-no">{staff?.staff_id_number ?? "—"}</span>}
                />
                <Field label="Rank / title" value={staff?.rank_title ?? "—"} />
                <Field label="Official email" value={staff?.official_email ?? "—"} />
                <Field label="Phone" value={staff?.phone ?? "—"} />
                <Field label="Nationality" value={staff?.nationality ?? "—"} />
                <Field
                  label="Passport number"
                  value={isProtocol ? (staff?.passport_number ?? "—") : "Restricted"}
                />
                <Field
                  label="Passport expiry"
                  value={staff?.passport_expiry ? shortDate(staff.passport_expiry) : "—"}
                />
                <div className="sm:col-span-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  {packComplete
                    ? "Travel pack complete — an agency may be assigned."
                    : "Travel pack incomplete — an agency may only be assigned with the Head of Protocol's written override."}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memos" className="mt-4 space-y-4">
            {isProtocol ? (
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle className="font-serif text-base">Generate a memo or letter</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Template" />
                    </SelectTrigger>
                    <SelectContent>
                      {(lookups?.templates ?? []).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Signatory name"
                    value={signatory}
                    onChange={(e) => setSignatory(e.target.value)}
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button disabled={!templateId}>
                        <FileText className="mr-1.5 h-4 w-4" /> Issue memo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Issue this memo?</DialogTitle>
                        <DialogDescription>
                          A memo number will be allocated and the wording locked. Later template
                          edits will not change it.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          onClick={() => generateMemo.mutate()}
                          disabled={generateMemo.isPending}
                        >
                          {generateMemo.isPending ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          ) : null}
                          Issue memo
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ) : null}

            {(data?.memos ?? []).length === 0 ? (
              <EmptyState title="No memo or letter issued yet" />
            ) : (
              (data?.memos ?? []).map((memo) => (
                <div key={memo.id} className="space-y-2">
                  <div className="flex justify-end print:hidden">
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Printer className="mr-1.5 h-4 w-4" /> Print
                    </Button>
                  </div>
                  <MemoPreview doc={memo} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="agency" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Assigned agency</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Agency" value={agency?.name ?? "Not yet assigned"} />
                <Field label="Contact" value={agency?.contact_person ?? "—"} />
                <Field label="Phone" value={agency?.phone ?? "—"} />
                <Field label="Email" value={agency?.email ?? "—"} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-base">Issued tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.tickets ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ticket recorded yet.</p>
                ) : (
                  (data?.tickets ?? []).map((t) => (
                    <div key={t.id} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-3">
                      <Field label="Airline" value={t.airline ?? "—"} />
                      <Field label="PNR" value={<span className="ref-no">{t.pnr ?? "—"}</span>} />
                      <Field label="Ticket no." value={<span className="ref-no">{t.ticket_number ?? "—"}</span>} />
                      <Field label="Route" value={t.route ?? "—"} />
                      <Field label="Departure" value={t.depart_at ? shortDate(t.depart_at) : "—"} />
                      <Field label="Amount" value={naira(t.amount)} />
                    </div>
                  ))
                )}

                {isProtocol ? (
                  <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                    {(
                      [
                        ["airline", "Airline"],
                        ["pnr", "PNR"],
                        ["ticket_number", "Ticket number"],
                        ["route", "Route"],
                        ["invoice_no", "Agency invoice no."],
                        ["amount", "Amount (₦)"],
                      ] as const
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <Label>{label}</Label>
                        <Input
                          value={ticket[key]}
                          onChange={(e) => setTicket((t) => ({ ...t, [key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label>Departure</Label>
                      <Input
                        type="datetime-local"
                        value={ticket.depart_at}
                        onChange={(e) => setTicket((t) => ({ ...t, depart_at: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Return</Label>
                      <Input
                        type="datetime-local"
                        value={ticket.return_at}
                        onChange={(e) => setTicket((t) => ({ ...t, return_at: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => recordTicket.mutate()}
                        disabled={recordTicket.isPending}
                      >
                        {recordTicket.isPending ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : null}
                        Mark ticket issued
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logistics" className="mt-4">
            <Card>
              <CardContent className="space-y-3 pt-6">
                {(data?.logistics ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No logistics items on this case.</p>
                ) : (
                  (data?.logistics ?? []).map((l) => (
                    <div key={l.id} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-3">
                      <Field label="Item" value={LOGISTICS_ITEM_LABEL[l.item_type] ?? l.item_type} />
                      <Field label="Vendor" value={l.vendor_name ?? "—"} />
                      <Field label="Confirmation" value={l.confirmation_no ?? "—"} />
                      <Field label="Location" value={l.location ?? "—"} />
                      <Field label="From" value={l.start_at ? shortDate(l.start_at) : "—"} />
                      <Field label="Amount" value={naira(l.amount)} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <ol className="space-y-4 border-l border-border pl-4">
                  {(data?.activity ?? []).map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{a.action}</p>
                      {a.detail ? (
                        <p className="text-sm text-muted-foreground">{a.detail}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        {a.actor_name ?? "System"} · {shortDate(a.created_at)}
                      </p>
                    </li>
                  ))}
                  {(data?.activity ?? []).length === 0 ? (
                    <li className="text-sm text-muted-foreground">No activity recorded.</li>
                  ) : null}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* right rail */}
        <div className="space-y-4 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Approval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data?.approvals ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No approval on file. Processing cannot begin without one.
                </p>
              ) : (
                (data?.approvals ?? []).map((a) => (
                  <div key={a.id} className="rounded-md border border-border p-3 text-sm">
                    <p className="font-medium capitalize">
                      {a.approval_kind} · {a.decision}
                    </p>
                    <p className="ref-no text-xs text-muted-foreground">{a.reference_no ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.approver_name ?? "—"} · {a.approved_on ? shortDate(a.approved_on) : "—"}
                    </p>
                    {a.comment ? <p className="mt-1 text-xs">{a.comment}</p> : null}
                  </div>
                ))
              )}

              {me?.isApprover || isProtocol ? (
                <div className="space-y-2 border-t border-border pt-3">
                  <Select value={appKind} onValueChange={setAppKind}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dgca">DGCA approval</SelectItem>
                      <SelectItem value="ministerial">Ministerial approval</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Approval reference"
                    value={appRef}
                    onChange={(e) => setAppRef(e.target.value)}
                  />
                  <Input type="date" value={appDate} onChange={(e) => setAppDate(e.target.value)} />
                  <Input
                    placeholder="Approver name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                  />
                  <Select value={appDecision} onValueChange={setAppDecision}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">Approve</SelectItem>
                      <SelectItem value="queried">Query</SelectItem>
                      <SelectItem value="rejected">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Comment"
                    value={appComment}
                    onChange={(e) => setAppComment(e.target.value)}
                  />
                  <Input type="file" onChange={(e) => setAppFile(e.target.files?.[0] ?? null)} />
                  <Button
                    className="w-full"
                    onClick={() => recordApproval.mutate()}
                    disabled={recordApproval.isPending}
                  >
                    {recordApproval.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : null}
                    Record decision
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {isProtocol ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-base">Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Field label="Officer" value={officer?.full_name ?? "Unassigned"} />
                  <Select value={assignOfficer} onValueChange={setAssignOfficer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {(lookups?.profiles ?? [])
                        .filter((p) =>
                          ["admin", "protocol_officer", "protocol_head"].includes(p.role),
                        )
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Field label="Agency" value={agency?.name ?? "Not assigned"} />
                  <Select value={assignAgency} onValueChange={setAssignAgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {(lookups?.agencies ?? []).map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={() => assign.mutate()}
                    disabled={assign.isPending || (!assignOfficer && !assignAgency)}
                  >
                    Save assignment
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-serif text-base">Move case file</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Select value={statusValue} onValueChange={setStatusValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Next status" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEXT_STATUSES[request.type as RequestType].map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Reason / note"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full" disabled={!statusValue}>
                        Update status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Move this case file?</DialogTitle>
                        <DialogDescription>
                          The requester will be notified and the change written to the activity
                          trail.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          onClick={() =>
                            changeStatus.mutate({ status: statusValue, reason: statusReason })
                          }
                          disabled={changeStatus.isPending}
                        >
                          Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-base">Amounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Requested" value={naira(request.amount_requested)} />
              <Field label="Approved" value={naira(request.amount_approved)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
