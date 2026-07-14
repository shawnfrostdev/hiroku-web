"use client";

import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { usePlayerStore } from "@/store/usePlayerStore";

interface TimelineBarProps {
  onSeek: (time: number) => void;
  skipTimes?: Array<{ type: string; startTime: number; endTime: number }>;
}

export default function TimelineBar({
  onSeek,
  skipTimes = [],
}: TimelineBarProps) {
  // Sync strictly to state selectors to prevent re-renders in higher parent panels
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverX, setHoverX] = useState<number | null>(null);
  const [hoverPercent, setHoverPercent] = useState<number>(0);

  const handleValueChange = (values: number[]) => {
    if (values.length > 0) {
      onSeek(values[0]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setHoverX(x);
    setHoverPercent(x / rect.width);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !duration) return;
    const touch = e.touches[0];
    if (!touch) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setHoverX(x);
    setHoverPercent(x / rect.width);
  };

  const handleTouchEnd = () => {
    if (!duration) return;
    onSeek(hoverPercent * duration);
    setHoverX(null);
  };

  const handleMouseLeave = () => {
    setHoverX(null);
  };

  const _formatTime = (timeInSecs: number) => {
    if (Number.isNaN(timeInSecs) || timeInSecs < 0) return "00:00";
    const hrs = Math.floor(timeInSecs / 3600);
    const mins = Math.floor((timeInSecs % 3600) / 60);
    const secs = Math.floor(timeInSecs % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: timeline interaction wrapper
    <div
      className="w-full flex items-center relative group py-[10px] md:py-[10px] cursor-pointer touch-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* OP/ED Highlights */}
      {duration > 0 &&
        skipTimes.map((skip) => {
          const leftPercent = (skip.startTime / duration) * 100;
          const widthPercent =
            ((skip.endTime - skip.startTime) / duration) * 100;

          // Don't render invalid segments
          if (leftPercent < 0 || widthPercent <= 0 || leftPercent > 100)
            return null;

          return (
            <div
              key={`skip-${skip.type}-${skip.startTime}`}
              className="absolute h-[6px] bg-yellow-500/70 pointer-events-none z-0 transition-opacity"
              style={{
                left: `${leftPercent}%`,
                width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          );
        })}

      {/* Time Tooltip */}
      {hoverX !== null && (
        <div
          className="absolute bottom-full mb-[6px] transform -translate-x-1/2 bg-[#141414] border border-[#282828] text-[#FFFFFF] text-[11px] font-medium py-[4px] px-[8px] rounded-[6px] shadow-xl pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150"
          style={{ left: hoverX }}
        >
          {_formatTime(hoverPercent * duration)}
        </div>
      )}

      {/* Hover Highlight Track */}
      {hoverX !== null && (
        <div
          className="absolute h-[6px] bg-white/30 rounded-l-full pointer-events-none z-0 transition-opacity duration-150"
          style={{
            width: `${hoverPercent * 100}%`,
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        />
      )}

      {/* Vertical Cursor Indicator */}
      {hoverX !== null && (
        <div
          className="absolute h-[12px] w-[2px] bg-white/60 pointer-events-none z-0 transition-opacity duration-150 transform -translate-x-1/2"
          style={{
            left: hoverX,
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      <Slider
        min={0}
        max={duration || 100}
        step={1}
        value={[currentTime]}
        onValueChange={handleValueChange}
        aria-label="Video Timeline"
        className="z-10 transition-opacity"
      />
    </div>
  );
}
