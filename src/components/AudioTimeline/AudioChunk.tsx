import { useEffect, useRef, useState } from "react";
import Peaks, { type PeaksInstance, type PeaksOptions } from "peaks.js";
import { audioContext } from "@/lib/utils/audio/context";
import { cn } from "@/lib/utils/cn";
import type { AudioChunkData } from "./types";

interface AudioChunkProps {
    chunk: AudioChunkData;
    /** Current zoom level: pixels per second. */
    pixelsPerSecond: number;
    /** Whether this chunk is currently being dragged. */
    isDragging: boolean;
    /** Called when the user presses down on this chunk to start a drag. */
    onMouseDown: (chunkId: string, e: React.MouseEvent) => void;
}

/**
 * Renders a single audio chunk card with a Peaks.js overview waveform.
 *
 * Each chunk creates its own hidden <audio> element and Peaks instance
 * so that multiple waveforms can coexist independently on the timeline.
 */
export default function AudioChunk({ chunk, pixelsPerSecond, isDragging, onMouseDown }: AudioChunkProps) {
    const overviewRef = useRef<HTMLDivElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const peaksRef = useRef<PeaksInstance | null>(null);
    const [ready, setReady] = useState(false);

    const width = chunk.durationSeconds * pixelsPerSecond;

    // ---------------------------------------------------------------
    // Initialise Peaks.js when the container mounts or audio URL changes.
    // ---------------------------------------------------------------
    useEffect(() => {
        const container = overviewRef.current;
        if (!container) return;

        // Create a dedicated <audio> element for this chunk.
        const audio = new Audio(chunk.audioUrl);
        audio.crossOrigin = "anonymous";
        audio.preload = "auto";
        audioRef.current = audio;

        const options: PeaksOptions = {
            axisTopMarkerHeight: 0,
            axisBottomMarkerHeight: 0,
            overview: {
                container,
                waveformColor: "rgba(139, 92, 246, 0.7)",
                playedWaveformColor: "rgba(168, 128, 255, 0.9)",
                showAxisLabels: false,
            },
            mediaElement: audio,
            webAudio: {
                audioContext: audioContext,
            },
        };

        Peaks.init(options, (err, instance) => {
            if (err || !instance) {
                console.error(`Peaks init error for "${chunk.label}":`, err);
                return;
            }
            peaksRef.current = instance;
            setReady(true);
        });

        return () => {
            peaksRef.current?.destroy();
            peaksRef.current = null;
            audio.pause();
            audio.src = "";
            setReady(false);
        };
    }, [chunk.audioUrl, chunk.label]);

    // Refit the waveform when pixel width changes (zoom).
    useEffect(() => {
        if (!ready || !peaksRef.current) return;
        const view = peaksRef.current.views.getView("overview");
        if (view) {
            view.fitToContainer();
        }
    }, [width, ready]);

    return (
        <div
            className={cn(
                "group relative shrink-0 select-none rounded-lg border",
                "bg-zinc-900 transition-shadow",
                isDragging
                    ? "z-30 border-violet-500 opacity-80 shadow-lg shadow-violet-500/20 ring-2 ring-violet-500/50"
                    : "border-zinc-700 hover:border-zinc-500 hover:shadow-md hover:shadow-zinc-800/50",
            )}
            style={{ width: `${width}px`, minWidth: "60px" }}
        >
            {/* Header — drag handle */}
            <div
                className={cn(
                    "flex items-center justify-between border-b border-zinc-700/60 px-2 py-1",
                    isDragging ? "cursor-grabbing" : "cursor-grab",
                )}
                onMouseDown={(e) => onMouseDown(chunk.id, e)}
            >
                <span className="text-xs font-semibold text-zinc-200 truncate">{chunk.label}</span>
                <span className="ml-2 shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
                    {chunk.durationSeconds.toFixed(1)}s
                </span>
            </div>

            {/* Waveform container */}
            <div ref={overviewRef} className="h-20 w-full" />
        </div>
    );
}
