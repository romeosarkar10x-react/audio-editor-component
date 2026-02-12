/**
 * Types and constants for the Audio Timeline Editor.
 */

/** Represents a single audio chunk in the timeline. */
export interface AudioChunkData {
    /** Unique identifier for this chunk. */
    id: string;
    /** Display label (e.g. "Chunk A"). */
    label: string;
    /** URL to the audio file (relative to public/). */
    audioUrl: string;
    /** Duration of the audio in seconds (loaded dynamically). */
    durationSeconds: number;
    /** Gap in pixels *before* this chunk. First chunk always has 0. */
    gapBefore: number;
}

/** Tracks the active drag operation. */
export interface DragState {
    /** ID of the chunk currently being dragged. */
    chunkId: string;
    /** Mouse X position at drag start (clientX). */
    startMouseX: number;
    /** The chunk's gapBefore value when the drag started. */
    initialGapBefore: number;
}

/** Default scale: pixels per second of audio duration. */
export const DEFAULT_PIXELS_PER_SECOND = 50;

/** Min / max bounds for the zoom slider. */
export const MIN_PIXELS_PER_SECOND = 20;
export const MAX_PIXELS_PER_SECOND = 150;
