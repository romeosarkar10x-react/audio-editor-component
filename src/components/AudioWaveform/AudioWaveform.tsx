import { useEffect, useRef, useState } from "react";
import Peaks from "peaks.js";
import type { PeaksInstance, PeaksOptions } from "peaks.js";
import { audioContext } from "@/lib/utils/audio/context";
import type { AudioDataType } from "@/types/AudioData";

export default function AudioWaveform({ audioData }: { audioData: AudioDataType }) {
    const [, setPeaks] = useState<PeaksInstance | null>(null);
    const overviewContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        (async () => {
            if (!overviewContainerRef.current) {
                return;
            }

            const options: PeaksOptions = {
                axisTopMarkerHeight: 0,
                axisBottomMarkerHeight: 0,
                overview: {
                    container: overviewContainerRef.current,
                    showAxisLabels: false,
                    waveformColor: "rgba(201, 223, 138, 1)", // #c9df8a with full opacity
                    playedWaveformColor: "rgba(119, 171, 89, 1)", // #77ab59 with full opacity
                    playheadWidth: 0,
                },
                webAudio: {
                    audioContext,
                    audioBuffer: audioData.buffer,
                },
                player: audioData.player,
            };

            Peaks.init(options, (err, instance) => {
                if (!instance) {
                    console.log("Peaks init error:", err);
                    return;
                }

                if (instance) {
                    setPeaks(instance);
                }
            });
        })();
    }, [setPeaks, audioData]);

    return (
        <>
            <div
                ref={overviewContainerRef}
                className="peaks_overview_container h-24 w-120 border-border border rounded-md pointer-events-none"
            ></div>
        </>
    );
}
