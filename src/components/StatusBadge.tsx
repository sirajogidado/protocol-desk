import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_TONE, type RequestStatus } from "@/lib/domain";

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info/10 text-info border-info/25",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  success: "bg-success/12 text-success border-success/30",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const tone = STATUS_TONE[status as RequestStatus] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {STATUS_LABEL[status as RequestStatus] ?? status}
    </span>
  );
}

export function ToneBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof TONE_CLASS;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
