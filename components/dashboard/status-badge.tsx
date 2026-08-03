import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AssignmentStatus,
  SubmissionStatus,
} from "@/lib/generated/prisma/client";

const ASSIGNMENT: Record<
  AssignmentStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "default" },
};

const SUBMISSION: Record<
  SubmissionStatus,
  { label: string; className?: string; variant?: never }
> = {
  NOT_SUBMITTED: { label: "Not submitted" },
  SUBMITTED: { label: "Submitted" },
  GRADED: {
    label: "Graded",
    className:
      "border-success/30 bg-success/10 text-success hover:bg-success/15",
  },
  RETURNED: { label: "Returned" },
  LATE: {
    label: "Late",
    className:
      "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15",
  },
};

export function AssignmentStatusBadge({ status }: { status: AssignmentStatus }) {
  const config = ASSIGNMENT[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function SubmissionStatusBadge({
  status,
}: {
  status: SubmissionStatus;
}) {
  const config = SUBMISSION[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        !config.className && "border-border bg-muted text-foreground",
        config.className,
      )}
    >
      {config.label}
    </Badge>
  );
}
