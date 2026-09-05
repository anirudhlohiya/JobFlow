export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-hairline-soft text-body";
    case "PENDING_REVIEW":
      return "bg-warning-soft text-warning-deep";
    case "QUEUED":
      return "bg-link-soft text-link-deep";
    case "SENT":
      return "bg-cyan-soft text-[#007970]";
    case "FOLLOW_UP_PENDING":
      return "bg-warning-soft text-warning-deep";
    case "FOLLOWED_UP":
      return "bg-cyan-soft text-[#007970]";
    case "REPLIED":
      return "bg-ink text-white";
    default:
      return "bg-hairline-soft text-body";
  }
}