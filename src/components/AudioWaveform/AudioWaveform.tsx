import { useEffect, useRef, useState } from "react";
import Peaks, { type PeaksInstance, type PeaksOptions } from "peaks.js";
import { audioContext } from "@/lib/utils/audio/context";
import { Button } from "../ui/button";
import { Pause, Play } from "lucide-react";

export default function AudioWaveform({
    id,
    audioInstance,
    isPlaying,
    onPlay,
    onPause,
}: {
    id: number;
    audioInstance: HTMLAudioElement;
    isPlaying: boolean;
    onPlay: (id: number) => void;
    onPause: (id: number) => void;
}) {
    const zoomviewContainerRef = useRef<HTMLDivElement | null>(null);
    const overviewContainerRef = useRef<HTMLDivElement | null>(null);

    const [peaks, setPeaks] = useState<PeaksInstance | null>(null);

    useEffect(() => {
        (async () => {
            if (!(zoomviewContainerRef.current && overviewContainerRef.current)) {
                return;
            }

            const options: PeaksOptions = {
                zoomview: { container: zoomviewContainerRef.current },
                overview: { container: overviewContainerRef.current },
                mediaElement: audioInstance,
                webAudio: {
                    audioContext: audioContext,
                },

                // keyboard: true,
                // nudgeIncrement: 0.01,
            };

            Peaks.init(options, (err, instance) => {
                if (!instance) {
                    console.log("Peaks init error:", err);
                    return;
                }

                if (instance) {
                    setPeaks(instance);
                    instance.on("player.playing", (time) => {
                        console.log("Playing:", time);
                    });
                    instance.on("player.timeupdate", (time) => {
                        console.log("TimeUpdate:", time);
                    });
                    instance.on("player.ended", () => {
                        console.log("ended");
                    });
                }
            });
        })();
    }, [audioInstance, setPeaks]);

    useEffect(() => {
        if (!peaks) {
            return;
        }

        if (isPlaying) {
            peaks.player.play();
        } else {
            peaks.player.pause();
        }
    }, [isPlaying]);

    return (
        <>
            <div className="flex gap-2 items-center">
                <Button size="sm" onClick={() => (isPlaying ? onPause : onPlay)(id)}>
                    {isPlaying ? <Pause /> : <Play />}
                </Button>
                <div className="border-border border w-120 rounded-md p-1">
                    <div ref={zoomviewContainerRef} className="peaks_zoomview_container  h-24"></div>
                    <div ref={overviewContainerRef} className="peaks_overview_container  h-8 border-t-2"></div>
                </div>
            </div>
        </>
    );
}
