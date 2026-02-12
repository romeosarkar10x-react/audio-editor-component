import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioChunkData, DragState } from "./types";

/** How close to the edge (px) the mouse must be to trigger auto-scroll. */
const EDGE_THRESHOLD = 80;
/** Max scroll speed in pixels per animation frame. */
const SCROLL_SPEED = 12;

/**
 * Custom hook encapsulating all drag-and-drop logic for the timeline.
 *
 * Drag rules:
 *  - Moving **right** increases the dragged chunk's `gapBefore`.
 *  - Moving **left** decreases `gapBefore`, clamped to 0.
 *  - Chunks after the dragged one shift automatically because the flex
 *    layout treats gaps as additive width — no manual reposition needed.
 *  - The first chunk's `gapBefore` is always 0 (cannot create leading gap).
 *
 * Auto-scroll:
 *  - When dragging near the right or left edge of the scroll container,
 *    the container scrolls automatically so the dragged chunk stays visible.
 */
export function useTimelineDrag(
    chunks: AudioChunkData[],
    setChunks: React.Dispatch<React.SetStateAction<AudioChunkData[]>>,
    scrollContainerRef: React.RefObject<HTMLDivElement | null>,
) {
    const [dragState, setDragState] = useState<DragState | null>(null);

    const dragRef = useRef<DragState | null>(null);
    const scrollRafRef = useRef<number | null>(null);
    const mouseXRef = useRef(0);

    // Refs that hold the latest versions of callback functions,
    // updated via useEffect to satisfy React's "no ref writes during render" rule.
    const autoScrollFnRef = useRef<() => void>(() => {});
    const handleMouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
    const handleMouseUpRef = useRef<() => void>(() => {});

    // ------------------------------------------------------------------
    // Stable listener references — never change identity, delegate to refs.
    // ------------------------------------------------------------------
    const stableMouseMove = useCallback((e: MouseEvent) => handleMouseMoveRef.current(e), []);
    const stableMouseUp = useCallback(() => handleMouseUpRef.current(), []);

    const stopAutoScroll = useCallback(() => {
        if (scrollRafRef.current !== null) {
            cancelAnimationFrame(scrollRafRef.current);
            scrollRafRef.current = null;
        }
    }, []);

    const startAutoScroll = useCallback(() => {
        if (scrollRafRef.current === null) {
            scrollRafRef.current = requestAnimationFrame(() => autoScrollFnRef.current());
        }
    }, []);

    // ------------------------------------------------------------------
    // Keep ref-held functions up-to-date via useEffect (not during render).
    // ------------------------------------------------------------------
    useEffect(() => {
        autoScrollFnRef.current = () => {
            const container = scrollContainerRef.current;
            if (!container || !dragRef.current) return;

            const rect = container.getBoundingClientRect();
            const mouseX = mouseXRef.current;

            const distFromRight = rect.right - mouseX;
            const distFromLeft = mouseX - rect.left;

            if (distFromRight < EDGE_THRESHOLD && distFromRight > 0) {
                const intensity = 1 - distFromRight / EDGE_THRESHOLD;
                container.scrollLeft += Math.ceil(SCROLL_SPEED * intensity);
            } else if (distFromLeft < EDGE_THRESHOLD && distFromLeft > 0) {
                const intensity = 1 - distFromLeft / EDGE_THRESHOLD;
                container.scrollLeft -= Math.ceil(SCROLL_SPEED * intensity);
            }

            scrollRafRef.current = requestAnimationFrame(() => autoScrollFnRef.current());
        };
    }, [scrollContainerRef]);

    useEffect(() => {
        handleMouseMoveRef.current = (e: MouseEvent) => {
            const drag = dragRef.current;
            if (!drag) return;

            mouseXRef.current = e.clientX;

            const deltaX = e.clientX - drag.startMouseX;
            const newGap = Math.max(0, drag.initialGapBefore + deltaX);

            setChunks((prev) => prev.map((c) => (c.id === drag.chunkId ? { ...c, gapBefore: newGap } : c)));
        };
    }, [setChunks]);

    useEffect(() => {
        handleMouseUpRef.current = () => {
            dragRef.current = null;
            setDragState(null);
            stopAutoScroll();
            document.removeEventListener("mousemove", stableMouseMove);
            document.removeEventListener("mouseup", stableMouseUp);
        };
    }, [stopAutoScroll, stableMouseMove, stableMouseUp]);

    // ------------------------------------------------------------------
    // Mouse-down handler: kick off a drag operation.
    // ------------------------------------------------------------------
    const onChunkMouseDown = useCallback(
        (chunkId: string, e: React.MouseEvent) => {
            if (e.button !== 0) return;
            e.preventDefault();

            const chunkIndex = chunks.findIndex((c) => c.id === chunkId);
            if (chunkIndex < 0) return;
            if (chunkIndex === 0) return;

            const chunk = chunks[chunkIndex];

            const state: DragState = {
                chunkId,
                startMouseX: e.clientX,
                initialGapBefore: chunk.gapBefore,
            };

            dragRef.current = state;
            mouseXRef.current = e.clientX;
            setDragState(state);

            startAutoScroll();
            document.addEventListener("mousemove", stableMouseMove);
            document.addEventListener("mouseup", stableMouseUp);
        },
        [chunks, startAutoScroll, stableMouseMove, stableMouseUp],
    );

    return { dragState, onChunkMouseDown };
}
