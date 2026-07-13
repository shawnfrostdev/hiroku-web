"use client";

import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/usePlayerStore";

interface TimelineBarProps {
  onSeek: (time: number) => void;
}

export default function TimelineBar({ onSeek }: TimelineBarProps) {
  // Sync strictly to state selectors to prevent re-renders in higher parent panels
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);

  const handleValueChange = (values: number[]) => {
    if (values.length > 0) {
      onSeek(values[0]);
    }
  };

  return (
    <div className="w-full flex items-center">
      <Slider
        min={0}
        max={duration || 100}
        step={1}
        value={[currentTime]}
        onValueChange={handleValueChange}
        aria-label="Video Timeline"
      />
    </div>
  );
}
