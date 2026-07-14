"use client";

import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
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
  onSkipBackward: () => void;
  onSkipForward: () => void;
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
  onSkipBackward,
  onSkipForward,
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
    (skip) => currentTime >= skip.startTime - 3 && currentTime <= skip.endTime,
  );

  const controlsVisible = isHoveringControls || !isPlaying;

  return (
    <>
      {/* ============================================================
          MOBILE CENTER OVERLAY — play/pause + skip 10s (hidden on md+)
          ============================================================ */}
      <div
        className={`md:hidden absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-[28px] pointer-events-auto">
          {/* Skip Backward 10s */}
          <button
            type="button"
            onClick={onSkipBackward}
            aria-label="Rewind 10 seconds"
            className="flex flex-col items-center gap-[4px] group"
          >
            <div className="w-[52px] h-[52px] rounded-full bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
              <RotateCcw className="w-[22px] h-[22px] text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/70 select-none">
              10s
            </span>
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={onPlayToggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-[64px] h-[64px] rounded-full bg-black/50 border border-white/25 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-[28px] h-[28px] text-white" />
            ) : (
              <Play className="w-[28px] h-[28px] text-white fill-current translate-x-[2px]" />
            )}
          </button>

          {/* Skip Forward 10s */}
          <button
            type="button"
            onClick={onSkipForward}
            aria-label="Skip forward 10 seconds"
            className="flex flex-col items-center gap-[4px] group"
          >
            <div className="w-[52px] h-[52px] rounded-full bg-black/40 border border-white/20 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
              <RotateCw className="w-[22px] h-[22px] text-white" />
            </div>
            <span className="text-[10px] font-bold text-white/70 select-none">
              10s
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          BOTTOM CONTROL BAR
          ============================================================ */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col z-10 transition-opacity duration-300 ${
          controlsVisible
            ? "opacity-100"
            : "opacity-0 md:group-hover:opacity-100"
        }`}
      >
        {/* Skip OP/ED Button — positioned above timeline */}
        {activeSkip && (
          <div className="flex justify-end px-[12px] md:px-[20px] pb-[4px]">
            <button
              type="button"
              onClick={() => onSeek(activeSkip.endTime)}
              className="flex items-center gap-[6px] bg-white text-black px-[14px] py-[7px] rounded-[6px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:bg-gray-200 transition-transform active:scale-95 cursor-pointer text-[13px]"
            >
              <SkipForward className="w-[15px] h-[15px]" />
              {activeSkip.type === "op" ? "Skip Opening" : "Skip Ending"}
            </button>
          </div>
        )}

        {/* ── MOBILE LAYOUT ── (hidden on md+) */}
        <div className="md:hidden flex flex-col px-[10px] pb-[10px] gap-[2px]">
          {/* Row 1: Prev/Next Episode + Volume (left) — Time + Settings (right) */}
          <div className="flex items-center justify-between w-full text-white">
            {/* Left: Prev/Next + Volume */}
            <div className="flex items-center gap-[4px]">
              {/* Prev Episode */}
              <button
                type="button"
                onClick={onPrevEpisode}
                disabled={currentEpNum === 1}
                className="h-[44px] w-[44px] flex items-center justify-center rounded-[8px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40"
                title="Previous Episode"
                aria-label="Previous Episode"
              >
                <SkipBack className="w-[16px] h-[16px]" />
              </button>

              {/* Next Episode */}
              <button
                type="button"
                onClick={onNextEpisode}
                disabled={currentEpNum === episodesCount}
                className="h-[44px] w-[44px] flex items-center justify-center rounded-[8px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40"
                title="Next Episode"
                aria-label="Next Episode"
              >
                <SkipForward className="w-[16px] h-[16px]" />
              </button>

              {/* Volume */}
              <VolumeControl
                onVolumeChange={onVolumeChange}
                onToggleMute={onToggleMute}
              />
            </div>

            {/* Right: Timestamp */}
            <div className="h-[36px] px-[10px] flex items-center text-[11px] font-bold text-white/90 select-none shrink-0">
              {formatTime(currentTime)}
              <span className="text-white/40 mx-[3px]">/</span>
              {formatTime(duration)}
            </div>
          </div>

          {/* Row 2: Timeline full-width */}
          <TimelineBar onSeek={onSeek} skipTimes={skipTimes} />

          {/* Row 3: Settings (speed / CC / quality / fullscreen) */}
          <div className="flex items-center justify-end gap-[2px] text-white">
            {/* Speed */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowSpeed((prev) => !prev);
                  setShowAudio(false);
                  setShowQuality(false);
                }}
                className="h-[44px] min-w-[44px] px-[8px] flex items-center justify-center rounded-[8px] hover:bg-white/15 text-white/90 text-[11px] font-bold cursor-pointer"
                aria-expanded={showSpeed}
                aria-label="Playback Speed"
              >
                {playbackRate}x
              </button>
              {showSpeed && (
                <div className="absolute bottom-[52px] right-0 bg-[#121212] border border-[#282828] rounded-[6px] p-[6px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[72px]">
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      type="button"
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSpeed(false);
                      }}
                      className={`px-[10px] py-[8px] text-xs text-left rounded-[4px] font-bold cursor-pointer hover:bg-white hover:text-black whitespace-nowrap ${
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

            {/* Subtitle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAudio((prev) => !prev);
                  setShowSpeed(false);
                  setShowQuality(false);
                }}
                className="h-[44px] min-w-[44px] px-[8px] flex items-center justify-center rounded-[8px] hover:bg-white/15 text-white/90 text-[11px] font-bold cursor-pointer"
                aria-expanded={showAudio}
                aria-label="Subtitle Language"
              >
                <span className="capitalize truncate whitespace-nowrap">
                  {currentSubtitle === "Off" ? "CC" : currentSubtitle}
                </span>
              </button>
              {showAudio && (
                <div className="absolute bottom-[52px] right-0 bg-[#121212] border border-[#282828] rounded-[6px] p-[6px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[100px]">
                  {availableSubtitles.map((sub: string) => (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => {
                        onSubtitleChange(sub);
                        setShowAudio(false);
                      }}
                      className={`px-[10px] py-[8px] text-xs text-left rounded-[4px] font-bold cursor-pointer hover:bg-white hover:text-black capitalize whitespace-nowrap ${
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

            {/* Quality */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowQuality((prev) => !prev);
                  setShowSpeed(false);
                  setShowAudio(false);
                }}
                className="h-[44px] min-w-[44px] px-[8px] flex items-center justify-center rounded-[8px] hover:bg-white/15 text-white/90 text-[11px] font-bold cursor-pointer"
                aria-expanded={showQuality}
                aria-label="Video Quality"
              >
                <span className="whitespace-nowrap">{currentResolution}</span>
              </button>
              {showQuality && (
                <div className="absolute bottom-[52px] right-0 bg-[#121212] border border-[#282828] rounded-[6px] p-[6px] flex flex-col gap-[4px] shadow-2xl z-30 min-w-[80px]">
                  {resolutions.map((res) => (
                    <button
                      type="button"
                      key={res}
                      onClick={() => {
                        onResolutionChange(res);
                        setShowQuality(false);
                      }}
                      className={`px-[10px] py-[8px] text-xs text-left rounded-[4px] font-bold cursor-pointer hover:bg-white hover:text-black capitalize whitespace-nowrap ${
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

            {/* Fullscreen */}
            <button
              type="button"
              onClick={onFullscreenToggle}
              className="h-[44px] w-[44px] flex items-center justify-center rounded-[8px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-[16px] h-[16px]" />
              ) : (
                <Maximize2 className="w-[16px] h-[16px]" />
              )}
            </button>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── (hidden on mobile, shown on md+) */}
        <div className="hidden md:flex flex-col gap-[12px] p-[20px]">
          {/* Timeline */}
          <TimelineBar onSeek={onSeek} skipTimes={skipTimes} />

          {/* Controls Row */}
          <div className="flex items-center justify-between w-full text-white">
            {/* Left Side Controls */}
            <div className="flex items-center gap-[16px]">
              {/* Play/Pause */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
                <button
                  type="button"
                  onClick={onPlayToggle}
                  className="h-[32px] w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-[20px] h-[20px]" />
                  ) : (
                    <Play className="w-[20px] h-[20px] fill-current" />
                  )}
                </button>
              </div>

              {/* Prev / Next Episode */}
              <div className="flex items-center gap-[2px] bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
                <button
                  type="button"
                  onClick={onPrevEpisode}
                  disabled={currentEpNum === 1}
                  className="h-[32px] w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Previous Episode"
                  aria-label="Previous Episode"
                >
                  <SkipBack className="w-[18px] h-[18px]" />
                </button>
                <button
                  type="button"
                  onClick={onNextEpisode}
                  disabled={currentEpNum === episodesCount}
                  className="h-[32px] w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent"
                  title="Next Episode"
                  aria-label="Next Episode"
                >
                  <SkipForward className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Volume */}
              <VolumeControl
                onVolumeChange={onVolumeChange}
                onToggleMute={onToggleMute}
              />

              {/* Timestamps */}
              <div className="h-[40px] px-[14px] bg-white/5 border border-white/10 rounded-[8px] flex items-center justify-center text-sm font-bold text-white/90 select-none shrink-0">
                {formatTime(currentTime)}{" "}
                <span className="text-white/40 mx-[4px]">/</span>{" "}
                {formatTime(duration)}
              </div>
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-[16px] relative shrink-0">
              {/* Settings (Speed, CC, Quality) */}
              <div className="flex items-center gap-[2px] bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
                {/* Speed */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSpeed((prev) => !prev);
                      setShowAudio(false);
                      setShowQuality(false);
                    }}
                    className="h-[32px] px-[8px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer text-xs font-bold"
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

                {/* Subtitle */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAudio((prev) => !prev);
                      setShowSpeed(false);
                      setShowQuality(false);
                    }}
                    className="h-[32px] px-[8px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer text-xs font-bold"
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

                {/* Quality */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuality((prev) => !prev);
                      setShowSpeed(false);
                      setShowAudio(false);
                    }}
                    className="h-[32px] px-[8px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer text-xs font-bold"
                    aria-expanded={showQuality}
                    aria-label="Video Quality"
                  >
                    <span className="whitespace-nowrap">
                      {currentResolution}
                    </span>
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

              {/* View Mode (Theater + Fullscreen) */}
              <div className="flex items-center gap-[2px] bg-white/5 border border-white/10 rounded-[8px] p-[4px]">
                {/* Theater */}
                <button
                  type="button"
                  onClick={onTheaterToggle}
                  className="hidden md:flex h-[32px] w-[32px] items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer"
                  title={isTheaterMode ? "Default View" : "Theater Mode"}
                  aria-label="Toggle Theater Mode"
                >
                  <span
                    className={`block w-[20px] h-[14px] border-2 rounded-[2px] ${isTheaterMode ? "border-white bg-white/20" : "border-white/60"}`}
                  />
                </button>

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={onFullscreenToggle}
                  className="h-[32px] w-[32px] flex items-center justify-center rounded-[6px] hover:bg-white/15 text-white/90 hover:text-white transition-all duration-150 cursor-pointer shrink-0"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  aria-label="Toggle Fullscreen"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-[16px] h-[16px]" />
                  ) : (
                    <Maximize2 className="w-[16px] h-[16px]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
