"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/usePlayerStore";

interface VolumeControlProps {
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export default function VolumeControl({
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);

  const handleVolumeSliderChange = (values: number[]) => {
    if (values.length > 0) {
      onVolumeChange(values[0]);
    }
  };

  return (
    <div className="group/volume flex items-center bg-white/5 border border-white/10 rounded-[8px] p-[4px] h-[36px] md:h-[40px] overflow-hidden transition-all duration-300 w-[36px] md:w-[40px] hover:w-[124px] md:hover:w-[128px] shrink-0">
      {/* Icon button inside container */}
      <button
        type="button"
        onClick={onToggleMute}
        className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />
        ) : (
          <Volume2 className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" />
        )}
      </button>

      {/* Slide-out range slider */}
      <div className="w-[76px] pl-[8px] flex items-center transition-opacity duration-300 opacity-0 group-hover/volume:opacity-100 shrink-0">
        <Slider
          min={0}
          max={1}
          step={0.05}
          value={[isMuted ? 0 : volume]}
          onValueChange={handleVolumeSliderChange}
          className="w-full"
          aria-label="Volume Level"
        />
      </div>
    </div>
  );
}
