import { cn } from "../lib/utils";

interface Props {
  isSelected?: boolean;
}

export function ReadStoryBadge({ isSelected = false }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        isSelected
          ? "border-accent/15 bg-accent/5 text-accent/70"
          : "border-edge/80 bg-surface text-fg-faint",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", isSelected ? "bg-accent/65" : "bg-fg-faint/70")}
      />
      Read
    </span>
  );
}
