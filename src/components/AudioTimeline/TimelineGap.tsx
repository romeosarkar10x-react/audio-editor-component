import { cn } from "@/lib/utils/cn";

interface TimelineGapProps {
    /** Width of the gap in pixels. */
    width: number;
}

/**
 * Visual spacer between audio chunks.
 * Shows a dotted center-line and a millisecond label when gap > 0.
 */
export default function TimelineGap({ width }: TimelineGapProps) {
    if (width <= 0) return null;

    return (
        <div
            className={cn("relative flex shrink-0 items-center justify-center", "select-none")}
            style={{ width: `${width}px` }}
        >
            {/* Dotted center line */}
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-zinc-500/40" />
        </div>
    );
}
