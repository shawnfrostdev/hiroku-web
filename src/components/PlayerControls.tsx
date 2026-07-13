"use client";

import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import TimelineBar from "./TimelineBar";
import VolumeControl from "./VolumeControl";

interface PlayerControlsProps {
  isPlaying: boolean;
  isFullscreen: boolean;
  isTheaterMode: boolean;
  isHoveringControls?: boolean;
  currentEpNum: number;
  episodesCount: number;
  currentSubtitle: string;
  availableSubtitles: string[];
  skipTimes?: Array<{ type: string; startTime: number; endTime: number }>;
  onPlayToggle: () => void;
  onPrevEpisode: () => void;
  onNextEpisode: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onPlaybackRateChange: (rate: number) => void;
  onSubtitleChange: (sub: string) => void;
  onResolutionChange: (res: string) => void;
  onTheaterToggle: () => void;
  onFullscreenToggle: () => void;
}

export default function PlayerControls({
  isPlaying,
  isFullscreen,
  isTheaterMode,
  isHoveringControls = true,
  currentEpNum,
  episodesCount,
  currentSubtitle,
  availableSubtitles,
  skipTimes = [],
  onPlayToggle,
  onPrevEpisode,
  onNextEpisode,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onSubtitleChange,
  onResolutionChange,
  onTheaterToggle,
  onFullscreenToggle,
}: PlayerControlsProps) {
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const currentResolution = usePlayerStore((state) => state.currentResolution);
  const availableResolutions = usePlayerStore(
    (state) => state.availableResolutions,
  );

  const [showSpeed, setShowSpeed] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showQuality, setShowQuality] = useState(false);

  const formatTime = (secs: number) => {
    if (Number.isNaN(secs) || secs === null || secs < 0) return "00:00";
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = Math.floor(secs % 60);

    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);

  // Fallback default resolutions if Shaka hasn't loaded track metadata yet
  const resolutions =
    availableResolutions.length > 0
      ? availableResolutions
      : ["1080p", "720p", "480p", "Auto"];

  const activeSkip = skipTimes?.find(
    (skip) => currentTime >= skip.startTime && currentTime <= skip.endTime,
  );

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 p-[12px] md:p-[20px] bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-[8px] md:gap-[12px] z-10 transition-opacity duration-300 ${
        isHoveringControls || !isPlaying
          ? "opacity-100"
          : "opacity-0 md:group-hover:opacity-100"
      }`}
    >
      {/* Skip OP/ED Button Overlay */}
      {activeSkip && (
        <div className="absolute bottom-[calc(100%+16px)] right-[24px] z-50">
          <button
            type="button"
            onClick={() => onSeek(activeSkip.endTime)}
            className="flex items-center gap-[8px] bg-white text-black px-[16px] py-[8px] rounded-[6px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:bg-gray-200 transition-transform active:scale-95 cursor-pointer"
          >
            <SkipForward className="w-[18px] h-[18px]" />
            {activeSkip.type === "op" ? "Skip Opening" : "Skip Ending"}
          </button>
        </div>
      )}

      {/* Headless progress slider bar */}
      <TimelineBar onSeek={onSeek} />

      {/* Buttons dashboard */}
      <div className="flex items-center justify-between w-full text-white">
        {/* Left Side Controls */}
        <div className="flex items-center gap-[8px] md:gap-[16px]">
          {/* Group 1: Play/Pause */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
            {/* Play/Pause Toggle */}
            <button
              type="button"
              onClick={onPlayToggle}
              className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-[16px] h-[16px] md:w-[20px] md:h-[20px]" />
              ) : (
                <Play className="w-[16px] h-[16px] md:w-[20px] md:h-[20px] fill-current" />
              )}
            </button>
          </div>

          {/* Group 2: Prev / Next */}
          <div className="flex items-center gap-[2px] bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
            {/* Previous Episode */}
            <button
              type="button"
              onClick={onPrevEpisode}
              disabled={currentEpNum === 1}
              className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
              title="Previous Episode"
              aria-label="Previous Episode"
            >
              <SkipBack className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" />
            </button>

            {/* Next Episode */}
            <button
              type="button"
              onClick={onNextEpisode}
              disabled={currentEpNum === episodesCount}
              className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
              title="Next Episode"
              aria-label="Next Episode"
            >
              <SkipForward className="w-[14px] h-[14px] md:w-[18px] md:h-[18px]" />
            </button>
          </div>

          {/* Group 2: Volume */}
          <VolumeControl
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />

          {/* Group 3: Timestamps */}
          <div className="h-[36px] md:h-[40px] px-[10px] md:px-[14px] bg-white/5 border border-white/10 rounded-[8px] flex items-center justify-center text-[10px] md:text-sm font-bold text-white/90 select-none shrink-0">
            {formatTime(currentTime)}{" "}
            <span className="text-white/40 mx-[2px] md:mx-[4px]">/</span>{" "}
            {formatTime(duration)}
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-[8px] md:gap-[16px] relative shrink-0">
          {/* Group 4: Settings (Speed, CC, Quality) */}
          <div className="flex items-center gap-[2px] bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSpeed((prev) => !prev);
                  setShowAudio(false);
                  setShowQuality(false);
                }}
                className="h-[28px] md:h-[32px] px-[8px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer text-[10px] md:text-xs font-bold"
                aria-expanded={showSpeed}
                aria-label="Playback Speed"
              >
                <span className="whitespace-nowrap">{playbackRate}x</span>
              </button>
              {showSpeed && (
                <div className="absolute bottom-[48px] right-0 bg-[#121212] border border-[#282828] rounded-[6px] p-[6px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[80px]">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      type="button"
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSpeed(false);
                      }}
                      className={`px-[10px] py-[6px] text-xs text-left rounded-[4px] font-bold cursor-pointer hover:bg-white hover:text-black whitespace-nowrap ${
                        playbackRate === rate
                          ? "bg-white text-black"
                          : "text-text-secondary"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitle Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAudio((prev) => !prev);
                  setShowSpeed(false);
                  setShowQuality(false);
                }}
                className="h-[28px] md:h-[32px] px-[8px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer text-[10px] md:text-xs font-bold"
                aria-expanded={showAudio}
                aria-label="Subtitle Language"
              >
                <span className="capitalize truncate whitespace-nowrap">
                  {currentSubtitle === "Off" ? "CC" : currentSubtitle}
                </span>
              </button>
              {showAudio && (
                <div className="absolute bottom-[48px] right-0 bg-[#121212] border border-[#282828] rounded-[6px] p-[6px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[100px]">
                  {availableSubtitles.map((sub: string) => (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => {
                        onSubtitleChange(sub);
                        setShowAudio(false);
                      }}
                      className={`px-[10px] py-[6px] text-xs text-left rounded-[4px] font-bold cursor-pointer hover:bg-white hover:text-black capitalize whitespace-nowrap ${
                        currentSubtitle === sub
                          ? "bg-white text-black"
                          : "text-text-secondary"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowQuality((prev) => !prev);
                  setShowSpeed(false);
                  setShowAudio(false);
                }}
                className="h-[28px] md:h-[32px] px-[8px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer text-[10px] md:text-xs font-bold"
                aria-expanded={showQuality}
                aria-label="Video Quality"
              >
                <span className="whitespace-nowrap">{currentResolution}</span>
              </button>
              {showQuality && (
                <div className="absolute bottom-[48px] right-0 bg-[#121212] border border-[#282828] rounded-[6px] p-[6px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[90px]">
                  {resolutions.map((res) => (
                    <button
                      type="button"
                      key={res}
                      onClick={() => {
                        onResolutionChange(res);
                        setShowQuality(false);
                      }}
                      className={`px-[10px] py-[6px] text-xs text-left rounded-[4px] font-bold cursor-pointer hover:bg-white hover:text-black capitalize whitespace-nowrap ${
                        currentResolution === res ||
                        (res === "Auto" && !currentResolution)
                          ? "bg-white text-black"
                          : "text-text-secondary"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Group 5: View Mode (Theater, Fullscreen) */}
          <div className="flex items-center gap-[2px] bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
            {/* Theater Toggle */}
            <button
              type="button"
              onClick={onTheaterToggle}
              className="hidden md:flex h-[28px] w-[28px] md:h-[32px] md:w-[32px] items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer"
              title={isTheaterMode ? "Default View" : "Theater Mode"}
              aria-label="Toggle Theater Mode"
            >
              <span
                className={`block w-[20px] h-[14px] border-2 rounded-[2px] ${isTheaterMode ? "border-white bg-white/20" : "border-white/60"}`}
              />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={onFullscreenToggle}
              className="h-[28px] w-[28px] md:h-[32px] md:w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer shrink-0"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />
              ) : (
                <Maximize2 className="w-[14px] h-[14px] md:w-[16px] md:h-[16px]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
