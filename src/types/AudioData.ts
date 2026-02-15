import type { PlayerAdapter } from "peaks.js";

export interface AudioDataType {
    buffer: AudioBuffer;
    player: PlayerAdapter;
}
