import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GLOBALS } from "@/globals";
import { DEFAULT_PIXELS_PER_SECOND, MIN_PIXELS_PER_SECOND, MAX_PIXELS_PER_SECOND, type AudioChunkData } from "./types";
import { useTimelineDrag } from "./useTimelineDrag";
import AudioChunk from "./AudioChunk";
import TimelineGap from "./TimelineGap";
import TimelineRuler from "./TimelineRuler";
import { ZoomIn, ZoomOut, Clock } from "lucide-react";

// ---------------------------------------------------------------
// Demo data — uses real MP3 files from public/sounds/.
// Durations are loaded dynamically on mount.
// ---------------------------------------------------------------
const DEMO_CHUNKS: Omit<AudioChunkData, "durationSeconds">[] = [
    { id: "a", label: "Arrow", audioUrl: `${GLOBALS.BASE_URL}/sounds/arrow.mp3`, gapBefore: 0 },
    { id: "b", label: "Clash Royale", audioUrl: `${GLOBALS.BASE_URL}/sounds/clashRoyale.mp3`, gapBefore: 0 },
    { id: "c", label: "Goblins", audioUrl: `${GLOBALS.BASE_URL}/sounds/goblins.mp3`, gapBefore: 0 },
    { id: "d", label: "Mini Pekka", audioUrl: `${GLOBALS.BASE_URL}/sounds/miniPekka.mp3`, gapBefore: 0 },
    { id: "e", label: "Rocket", audioUrl: `${GLOBALS.BASE_URL}/sounds/rocket.mp3`, gapBefore: 0 },
];

/**
 * Loads the duration of an audio file by creating a temporary <audio> element
 * and waiting for its `loadedmetadata` event.
 */
function loadAudioDuration(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.preload = "metadata";
        audio.addEventListener("loadedmetadata", () => {
            resolve(audio.duration);
        });
        audio.addEventListener("error", () => {
            reject(new Error(`Failed to load audio: ${url}`));
        });
    });
}

/**
 * Main Audio Timeline Editor component.
 *
 * Renders a horizontally-scrollable timeline of audio waveforms
 * that can be dragged apart to create gaps.
 */
export default function AudioTimeline() {
    const [chunks, setChunks] = useState<AudioChunkData[]>([]);
    const [pixelsPerSecond, setPixelsPerSecond] = useState(DEFAULT_PIXELS_PER_SECOND);
    const [loading, setLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Convert vertical wheel → horizontal scroll inside the timeline.
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [loading]);

    // ------------------------------------------------------------------
    // Load audio durations on mount.
    // ------------------------------------------------------------------
    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const loaded: AudioChunkData[] = await Promise.all(
                    DEMO_CHUNKS.map(async (c) => {
                        const dur = await loadAudioDuration(c.audioUrl);
                        return { ...c, durationSeconds: dur };
                    }),
                );
                if (!cancelled) {
                    setChunks(loaded);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading audio durations:", err);
                // Fallback: assign a default duration so the UI still works.
                if (!cancelled) {
                    setChunks(DEMO_CHUNKS.map((c) => ({ ...c, durationSeconds: 5 })));
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // Drag hook.
    const { dragState, onChunkMouseDown } = useTimelineDrag(chunks, setChunks, scrollContainerRef);

    // Total duration label.
    const totalDuration = useMemo(() => chunks.reduce((sum, c) => sum + c.durationSeconds, 0), [chunks]);

    const handleZoomChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPixelsPerSecond(Number(e.target.value));
    }, []);

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex h-48 items-center justify-center rounded-xl bg-zinc-950 text-zinc-400">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                    Loading audio files…
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                <h2 className="text-sm font-semibold text-zinc-200 tracking-wide">Audio Timeline</h2>

                <div className="flex items-center gap-4">
                    {/* Total duration */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock size={13} />
                        <span className="font-mono">{totalDuration.toFixed(1)}s</span>
                    </div>

                    {/* Zoom slider */}
                    <div className="flex items-center gap-2">
                        <ZoomOut size={14} className="text-zinc-500" />
                        <input
                            type="range"
                            min={MIN_PIXELS_PER_SECOND}
                            max={MAX_PIXELS_PER_SECOND}
                            value={pixelsPerSecond}
                            onChange={handleZoomChange}
                            className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-zinc-700 accent-violet-500"
                        />
                        <ZoomIn size={14} className="text-zinc-500" />
                        <span className="w-12 text-right text-[10px] font-mono text-zinc-500">
                            {pixelsPerSecond}px/s
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Scrollable timeline area ── */}
            <div
                ref={scrollContainerRef}
                className="overflow-x-auto px-4 pt-2 pb-4 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-zinc-800/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-600 [&::-webkit-scrollbar-thumb:hover]:bg-zinc-500"
            >
                {/* Global timestamp ruler */}
                <TimelineRuler chunks={chunks} pixelsPerSecond={pixelsPerSecond} />

                {/* Chunks row */}
                <div className="flex flex-nowrap items-end">
                    {chunks.map((chunk, i) => (
                        <div key={chunk.id} className="flex shrink-0 items-end">
                            {/* Gap spacer (skip for the first chunk) */}
                            {i > 0 && <TimelineGap width={chunk.gapBefore} />}

                            {/* Audio chunk card */}
                            <AudioChunk
                                chunk={chunk}
                                pixelsPerSecond={pixelsPerSecond}
                                isDragging={dragState?.chunkId === chunk.id}
                                onMouseDown={onChunkMouseDown}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Footer hint ── */}
            <div className="border-t border-zinc-800 px-4 py-1.5 text-[10px] text-zinc-600">
                Click &amp; drag any chunk (except the first) to reposition · Scroll horizontally to see more
            </div>
        </div>
    );
}
