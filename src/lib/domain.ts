export const REQUEST_TYPES = [
  "ticket",
  "ticket_refund",
  "visa_refund",
  "intro_letter",
  "logistics",
] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_TYPE_LABEL: Record<RequestType, string> = {
  ticket: "Ticket request",
  ticket_refund: "Ticket refund",
  visa_refund: "Visa refund",
  intro_letter: "Introduction letter",
  logistics: "Logistics",
};

export const REQUEST_STATUSES = [
  "draft",
  "awaiting_approval",
  "approved",
  "documents_pending",
  "memo_raised",
  "with_agency",
  "ticket_issued",
  "under_review",
  "recommended_for_payment",
  "closed",
  "queried",
  "rejected",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STATUS_LABEL: Record<RequestStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting approval",
  approved: "Approved",
  documents_pending: "Documents pending",
  memo_raised: "Memo raised",
  with_agency: "With agency",
  ticket_issued: "Ticket issued",
  under_review: "Under review",
  recommended_for_payment: "Recommended for payment",
  closed: "Closed",
  queried: "Queried",
  rejected: "Rejected",
};

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

export const STATUS_TONE: Record<RequestStatus, Tone> = {
  draft: "neutral",
  awaiting_approval: "warning",
  approved: "success",
  documents_pending: "warning",
  memo_raised: "info",
  with_agency: "info",
  ticket_issued: "success",
  under_review: "info",
  recommended_for_payment: "success",
  closed: "neutral",
  queried: "danger",
  rejected: "danger",
};

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  protocol_head: "Head of Protocol",
  protocol_officer: "Protocol Officer",
  approver: "Approving Officer",
  staff: "Staff",
};

/** Workflow next-step options offered per request type. */
export const NEXT_STATUSES: Record<RequestType, RequestStatus[]> = {
  ticket: [
    "awaiting_approval",
    "approved",
    "documents_pending",
    "memo_raised",
    "with_agency",
    "ticket_issued",
    "closed",
    "queried",
    "rejected",
  ],
  ticket_refund: [
    "awaiting_approval",
    "under_review",
    "documents_pending",
    "memo_raised",
    "recommended_for_payment",
    "closed",
    "queried",
    "rejected",
  ],
  visa_refund: [
    "awaiting_approval",
    "under_review",
    "documents_pending",
    "memo_raised",
    "recommended_for_payment",
    "closed",
    "queried",
    "rejected",
  ],
  intro_letter: ["awaiting_approval", "approved", "documents_pending", "closed", "queried", "rejected"],
  logistics: ["awaiting_approval", "approved", "documents_pending", "memo_raised", "closed", "queried"],
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  passport_biodata: "Passport biodata page",
  staff_id_card: "Staff ID card",
  approval_letter: "Approval letter",
  ticket: "Ticket",
  receipt: "Receipt",
  visa_receipt: "Visa payment receipt",
  invoice: "Agency invoice",
  other: "Other document",
};

export const LOGISTICS_ITEM_LABEL: Record<string, string> = {
  hotel: "Hotel",
  transport: "Transport",
  hall: "Hall / venue",
  flight: "Flight",
  meet_assist: "Meet & assist",
};

/** Documents the Protocol Unit requires before a case file can progress. */
export function requiredDocsFor(type: RequestType, scope: string | null): string[] {
  switch (type) {
    case "ticket":
      return scope === "international"
        ? ["approval_letter", "passport_biodata", "staff_id_card"]
        : ["approval_letter", "staff_id_card"];
    case "ticket_refund":
      return ["approval_letter", "ticket", "receipt"];
    case "visa_refund":
      return ["approval_letter", "visa_receipt", "passport_biodata"];
    case "intro_letter":
      return ["passport_biodata", "staff_id_card"];
    case "logistics":
      return ["approval_letter"];
    default:
      return [];
  }
}
