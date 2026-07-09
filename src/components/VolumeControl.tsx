"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/usePlayerStore";

interface VolumeControlProps {
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
}

export default function VolumeControl({ onVolumeChange, onToggleMute }: VolumeControlProps) {
  const volume = usePlayerStore((state) => state.volume);
  const isMuted = usePlayerStore((state) => state.isMuted);

  const handleVolumeSliderChange = (values: number[]) => {
    if (values.length > 0) {
      onVolumeChange(values[0]);
    }
  };

  return (
    <div className="group/volume flex items-center bg-white/5 border border-white/10 rounded-[6px] h-[32px] overflow-hidden transition-all duration-300 w-[32px] hover:w-[120px] shrink-0">
      {/* Icon button inside container */}
      <button
        type="button"
        onClick={onToggleMute}
        className="h-[32px] w-[32px] flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-[18px] h-[18px]" />
        ) : (
          <Volume2 className="w-[18px] h-[18px]" />
        )}
      </button>

      {/* Slide-out range slider */}
      <div className="w-[76px] pr-[10px] flex items-center transition-opacity duration-300 opacity-0 group-hover/volume:opacity-100 shrink-0">
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
