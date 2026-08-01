"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  onControlsLockChange?: (locked: boolean) => void;
  onUserInteraction?: () => void;
  isLoading?: boolean;
  isStreamLoading?: boolean;
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
  onSkipBackward: _onSkipBackward,
  onSkipForward: _onSkipForward,
  onVolumeChange,
  onToggleMute,
  onPlaybackRateChange,
  onSubtitleChange,
  onResolutionChange,
  onTheaterToggle,
  onFullscreenToggle,
  onControlsLockChange,
  onUserInteraction,
  isLoading = false,
  isStreamLoading = false,
}: PlayerControlsProps) {
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const currentResolution = usePlayerStore((state) => state.currentResolution);
  const availableResolutions = usePlayerStore(
    (state) => state.availableResolutions,
  );

  const [showSpeed, setShowSpeed] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileActivePage, setMobileActivePage] = useState<
    "root" | "speed" | "subtitles" | "quality"
  >("root");

  const isSettingsOpen =
    showSpeed || showAudio || showQuality || isMobileSidebarOpen;
  const isLocked = isDragging || isSettingsOpen;

  useEffect(() => {
    onControlsLockChange?.(isLocked);
  }, [isLocked, onControlsLockChange]);

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
          MOBILE CENTER OVERLAY — Prev Ep | Play/Pause | Next Ep
          Uses inset-0 so it is always centered in the FULL player area,
          independent of the bottom control bar height or visibility.
          ============================================================ */}
      <div
        className={`md:hidden absolute inset-0 flex items-center justify-center pointer-events-none z-20 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: capture bubbled interactions */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: capture bubbled interactions */}
        <div
          className={`flex items-center gap-[24px] ${controlsVisible ? "pointer-events-auto" : "pointer-events-none"}`}
          onClick={onUserInteraction}
          onTouchStart={onUserInteraction}
        >
          {/* Previous Episode */}
          <button
            type="button"
            onClick={onPrevEpisode}
            disabled={currentEpNum === 1}
            aria-label="Previous Episode"
            title="Previous Episode"
            className="w-[42px] h-[42px] rounded-full bg-control border border-border-line backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 cursor-pointer"
          >
            <SkipBack className="w-[17px] h-[17px] text-white" />
          </button>

          {/* Play / Pause or Loading spinner */}
          {isLoading ? (
            <div className="w-[52px] h-[52px] rounded-full bg-control border border-border-line backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Loader2 className="w-[20px] h-[20px] text-white animate-spin" />
            </div>
          ) : (
            <button
              type="button"
              onClick={onPlayToggle}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-[52px] h-[52px] rounded-full bg-control border border-border-line backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-[20px] h-[20px] text-white" />
              ) : (
                <Play className="w-[20px] h-[20px] text-white fill-current translate-x-[1px]" />
              )}
            </button>
          )}

          {/* Next Episode */}
          <button
            type="button"
            onClick={onNextEpisode}
            disabled={currentEpNum === episodesCount}
            aria-label="Next Episode"
            title="Next Episode"
            className="w-[42px] h-[42px] rounded-full bg-control border border-border-line backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 cursor-pointer"
          >
            <SkipForward className="w-[17px] h-[17px] text-white" />
          </button>
        </div>
      </div>

      {/* Mobile Skip OP/ED Button (independent of controls, always visible/interactive in OP/ED window) */}
      {activeSkip && !isMobileSidebarOpen && (
        <div className="md:hidden absolute bottom-[44px] right-[12px] z-20">
          <button
            type="button"
            onClick={() => onSeek(activeSkip.endTime)}
            className="flex items-center gap-[6px] bg-white text-black px-[14px] py-[7px] rounded-[6px] font-bold shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:bg-gray-200 transition-transform active:scale-95 cursor-pointer text-[13px] pointer-events-auto"
          >
            <SkipForward className="w-[15px] h-[15px]" />
            {activeSkip.type === "op" ? "Skip OP" : "Skip ED"}
          </button>
        </div>
      )}

      {/* ============================================================
          BOTTOM CONTROL BAR
          ============================================================ */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: capture bubbled interactions */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: capture bubbled interactions */}
      <div
        onClick={onUserInteraction}
        onTouchStart={onUserInteraction}
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col z-10 transition-opacity duration-300 ${
          controlsVisible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto"
        }`}
      >
        {/* Skip OP/ED Button */}
        {activeSkip && (
          <div className="flex justify-end px-[12px] md:px-[20px] pb-[4px] hidden md:flex">
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
        <div className="md:hidden flex flex-col pb-[6px]">
          {/* Single row: Timestamp (left) — Settings (right) — compact ~24px height */}
          <div className="flex items-center justify-between w-full text-white px-[10px]">
            {/* Timestamp */}
            <span className="text-[11px] font-semibold text-white/80 select-none tabular-nums">
              {formatTime(currentTime)}
              <span className="text-white/35 mx-[4px]">/</span>
              {formatTime(duration)}
            </span>

            {/* Settings: Gear icon | Fullscreen */}
            <div className="flex items-center gap-[6px]">
              {/* Gear Settings Button */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(true);
                  setMobileActivePage("root");
                }}
                className="h-[28px] w-[28px] flex items-center justify-center text-white/80 cursor-pointer"
                aria-label="Open Settings"
              >
                <Settings className="w-[15px] h-[15px]" />
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={onFullscreenToggle}
                className="h-[28px] w-[28px] flex items-center justify-center text-white/80 cursor-pointer"
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-[13px] h-[13px]" />
                ) : (
                  <Maximize2 className="w-[13px] h-[13px]" />
                )}
              </button>
            </div>
          </div>

          {/* Timeline — no horizontal padding, stretches to player edges */}
          <div className="-mt-[4px]">
            <TimelineBar
              onSeek={onSeek}
              skipTimes={skipTimes}
              onDragStateChange={setIsDragging}
            />
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── (hidden on mobile, shown on md+) */}
        {!isStreamLoading && (
          <div className="hidden md:flex flex-col gap-[12px] p-[20px]">
            {/* Timeline */}
            <TimelineBar
              onSeek={onSeek}
              skipTimes={skipTimes}
              onDragStateChange={setIsDragging}
            />

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
        )}
      </div>
      {/* ============================================================
          MOBILE SETTINGS SIDEBAR & BACKDROP
          ============================================================ */}
      {isMobileSidebarOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop close action */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop close action */}
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden absolute inset-0 bg-black/45 backdrop-blur-[1px] z-30 transition-opacity duration-300 pointer-events-auto"
          />

          {/* biome-ignore lint/a11y/noStaticElementInteractions: sidebar container wrapper */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: sidebar container wrapper */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="md:hidden absolute right-0 top-0 bottom-0 z-40 w-[50%] bg-[#121212]/95 backdrop-blur-md border-l border-white/10 flex flex-col shadow-[2xl] animate-slide-in-right text-white pointer-events-auto"
          >
            <div className="flex items-center justify-between px-[10px] py-[8px] border-b border-white/5">
              <div className="flex items-center gap-[8px]">
                {mobileActivePage !== "root" && (
                  <button
                    type="button"
                    onClick={() => setMobileActivePage("root")}
                    className="p-[2px] -ml-[2px] rounded-full hover:bg-white/10 cursor-pointer"
                    aria-label="Go Back"
                  >
                    <ChevronLeft className="w-[14px] h-[14px]" />
                  </button>
                )}
                <span className="text-xs font-bold tracking-wide">
                  {mobileActivePage === "root" && "Settings"}
                  {mobileActivePage === "speed" && "Playback Speed"}
                  {mobileActivePage === "subtitles" && "Subtitles"}
                  {mobileActivePage === "quality" && "Quality"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-[2px] rounded-full hover:bg-white/10 cursor-pointer"
                aria-label="Close Settings"
              >
                <X className="w-[14px] h-[14px]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-[6px] flex flex-col gap-[3px]">
              {mobileActivePage === "root" && (
                <div className="flex flex-col gap-[3px]">
                  <button
                    type="button"
                    onClick={() => setMobileActivePage("speed")}
                    className="flex items-center justify-between w-full p-[8px] py-[6px] rounded-[4px] hover:bg-white/5 text-xs font-bold text-left cursor-pointer transition-colors"
                  >
                    <span>Playback Speed</span>
                    <div className="flex items-center gap-[2px] text-white/50 font-normal">
                      <span>{playbackRate}x</span>
                      <ChevronRight className="w-[12px] h-[12px]" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileActivePage("subtitles")}
                    className="flex items-center justify-between w-full p-[8px] py-[6px] rounded-[4px] hover:bg-white/5 text-xs font-bold text-left cursor-pointer transition-colors"
                  >
                    <span>Subtitles</span>
                    <div className="flex items-center gap-[2px] text-white/50 font-normal">
                      <span className="capitalize">
                        {currentSubtitle === "Off" ? "Off" : currentSubtitle}
                      </span>
                      <ChevronRight className="w-[12px] h-[12px]" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileActivePage("quality")}
                    className="flex items-center justify-between w-full p-[8px] py-[6px] rounded-[4px] hover:bg-white/5 text-xs font-bold text-left cursor-pointer transition-colors"
                  >
                    <span>Quality</span>
                    <div className="flex items-center gap-[2px] text-white/50 font-normal">
                      <span>{currentResolution}</span>
                      <ChevronRight className="w-[12px] h-[12px]" />
                    </div>
                  </button>
                </div>
              )}

              {mobileActivePage === "speed" &&
                [0.5, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    type="button"
                    key={rate}
                    onClick={() => {
                      onPlaybackRateChange(rate);
                    }}
                    className={`flex items-center justify-between w-full p-[8px] py-[6px] rounded-[4px] hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors ${
                      playbackRate === rate ? "text-[#10B981]" : "text-white/95"
                    }`}
                  >
                    <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                    {playbackRate === rate && (
                      <Check className="w-[12px] h-[12px] text-[#10B981]" />
                    )}
                  </button>
                ))}

              {mobileActivePage === "subtitles" &&
                availableSubtitles.map((sub: string) => (
                  <button
                    type="button"
                    key={sub}
                    onClick={() => {
                      onSubtitleChange(sub);
                    }}
                    className={`flex items-center justify-between w-full p-[8px] py-[6px] rounded-[4px] hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors capitalize ${
                      currentSubtitle === sub
                        ? "text-[#10B981]"
                        : "text-white/95"
                    }`}
                  >
                    <span>{sub}</span>
                    {currentSubtitle === sub && (
                      <Check className="w-[12px] h-[12px] text-[#10B981]" />
                    )}
                  </button>
                ))}

              {mobileActivePage === "quality" &&
                resolutions.map((res) => (
                  <button
                    type="button"
                    key={res}
                    onClick={() => {
                      onResolutionChange(res);
                    }}
                    className={`flex items-center justify-between w-full p-[8px] py-[6px] rounded-[4px] hover:bg-white/5 text-xs font-bold cursor-pointer transition-colors capitalize ${
                      currentResolution === res ||
                      (res === "Auto" && !currentResolution)
                        ? "text-[#10B981]"
                        : "text-white/95"
                    }`}
                  >
                    <span>{res}</span>
                    {(currentResolution === res ||
                      (res === "Auto" && !currentResolution)) && (
                      <Check className="w-[12px] h-[12px] text-[#10B981]" />
                    )}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
