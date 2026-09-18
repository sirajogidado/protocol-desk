import { NCAA_LOGO_URL } from "@/lib/assets";
import { longDate } from "@/lib/format";

export type MemoDoc = {
  reference_no: string;
  subject: string;
  body_snapshot: string;
  doc_kind: string;
  signatory_name: string | null;
  signatory_title: string | null;
  cc_list: string | null;
  created_at: string;
};

/** Printable A4 rendering of an issued memo or introduction letter. */
export function MemoPreview({ doc }: { doc: MemoDoc }) {
  return (
    <article className="mx-auto w-full max-w-[794px] rounded-lg border border-border bg-card p-8 shadow-sm print:border-0 print:shadow-none">
      <header className="flex items-center gap-4 border-b-2 border-primary pb-4">
        <img src={NCAA_LOGO_URL} alt="" className="h-16 w-16 object-contain" />
        <div className="leading-tight">
          <p className="font-serif text-lg font-semibold text-foreground">
            Nigeria Civil Aviation Authority
          </p>
          <p className="text-sm text-muted-foreground">Office of the DGCA · Protocol Unit</p>
          <p className="text-xs text-muted-foreground">
            Aviation House, Abuja · protocol@ncaa.gov.ng
          </p>
        </div>
      </header>

      <div className="mt-6 flex items-start justify-between text-sm">
        <span className="ref-no">{doc.reference_no}</span>
        <span>{longDate(doc.created_at)}</span>
      </div>

      <h2 className="mt-6 text-center font-serif text-base font-semibold uppercase tracking-wide">
        {doc.subject}
      </h2>

      <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-foreground">
        {doc.body_snapshot}
      </div>

      <footer className="mt-12 text-sm">
        <div className="h-12 w-56 border-b border-foreground/50" />
        <p className="mt-2 font-medium">{doc.signatory_name ?? "—"}</p>
        <p className="text-muted-foreground">{doc.signatory_title ?? ""}</p>
        {doc.cc_list ? (
          <p className="mt-6 text-xs text-muted-foreground">CC: {doc.cc_list}</p>
        ) : null}
      </footer>
    </article>
  );
}
