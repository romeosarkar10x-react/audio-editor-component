import { useMemo } from "react";
import type { AudioChunkData } from "./types";

interface TimelineRulerProps {
    /** Current chunks array (needed to compute total width). */
    chunks: AudioChunkData[];
    /** Current zoom level: pixels per second. */
    pixelsPerSecond: number;
}

/**
 * Formats seconds into a timestamp string.
 *  - Under 60s: "0:05", "0:30"
 *  - 60s+:      "1:00", "1:15", "2:30"
 */
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Number of extra tick intervals to show beyond the content. */
const EXTRA_TICKS = 3;

/**
 * Pick a "nice" tick interval (in seconds) so that adjacent ticks
 * are at least `minPixelGap` pixels apart at the current zoom level.
 */
export function chooseTickInterval(pixelsPerSecond: number, minPixelGap = 60): number {
    const candidates = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
    for (const c of candidates) {
        if (c * pixelsPerSecond >= minPixelGap) return c;
    }
    return candidates[candidates.length - 1];
}

/**
 * Global "Audacity-style" timeline ruler that sits above the chunks.
 *
 * It treats the entire timeline as a continuous linear time axis:
 *   pixel position = time (seconds) × pixelsPerSecond
 *
 * Gaps between chunks count as silence, so their pixel width maps
 * to gapBefore / pixelsPerSecond seconds of timeline time.
 *
 * The ruler must have the **exact same pixel width** as the chunks
 * row below it so they stay aligned when scrolling.
 */
export default function TimelineRuler({ chunks, pixelsPerSecond }: TimelineRulerProps) {
    // ---------------------------------------------------------------
    // Compute the total pixel width of the timeline row
    // (must match the chunk row exactly).
    // ---------------------------------------------------------------
    const contentWidth = useMemo(() => {
        return chunks.reduce((sum, c) => {
            return sum + c.gapBefore + c.durationSeconds * pixelsPerSecond;
        }, 0);
    }, [chunks, pixelsPerSecond]);

    // ---------------------------------------------------------------
    // Generate tick marks.
    // ---------------------------------------------------------------
    const { ticks, rulerWidth } = useMemo(() => {
        const interval = chooseTickInterval(pixelsPerSecond);
        const contentSeconds = contentWidth / pixelsPerSecond;
        // Extend ruler by EXTRA_TICKS intervals beyond the content.
        const extendedSeconds = contentSeconds + interval * EXTRA_TICKS;
        const extendedWidth = extendedSeconds * pixelsPerSecond;

        const result: { time: number; px: number; isMajor: boolean }[] = [];

        for (let t = 0; t <= extendedSeconds; t += interval) {
            const px = t * pixelsPerSecond;
            const isMajor = t === 0 || t % (interval * 2) === 0;
            result.push({ time: t, px, isMajor });
        }

        return { ticks: result, rulerWidth: extendedWidth };
    }, [contentWidth, pixelsPerSecond]);

    return (
        <div
            className="relative shrink-0 border-b border-zinc-700/50"
            style={{ width: `${rulerWidth}px`, height: "28px" }}
        >
            {ticks.map((tick) => (
                <div
                    key={tick.time}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${tick.px}px` }}
                >
                    {/* Tick line */}
                    <div className={tick.isMajor ? "w-px bg-zinc-500 h-3" : "w-px bg-zinc-600/60 h-2"} />

                    {/* Label — only on major ticks */}
                    {tick.isMajor && (
                        <span className="mt-px text-[9px] font-mono text-zinc-500 leading-none select-none whitespace-nowrap">
                            {formatTime(tick.time)}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
