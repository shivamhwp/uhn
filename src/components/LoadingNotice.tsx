import { SpinnerIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

interface LoadingNoticeProps {
  className?: string;
}

export function LoadingNotice({ className = "" }: LoadingNoticeProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-sm text-fg-faint ${className}`.trim()}
    >
      <SpinnerIcon size={18} className="animate-spin text-fg-muted" />
      <span>slow down buddy</span>
    </div>
  );
}

interface AutoLoadIndicatorProps {
  enabled: boolean;
  isLoading?: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function AutoLoadIndicator({
  enabled,
  isLoading = false,
  onLoadMore,
  className,
}: AutoLoadIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isLoading) requestedRef.current = false;
  }, [enabled, isLoading]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || isLoading || requestedRef.current) return;
        requestedRef.current = true;
        onLoadMore();
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, isLoading, onLoadMore]);

  if (!enabled && !isLoading) return null;

  return (
    <div ref={ref}>
      <LoadingNotice className={className} />
    </div>
  );
}
