import { beforeEach, describe, expect, it } from "vitest";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";

describe("useWatchlistStore", () => {
  beforeEach(() => {
    useWatchlistStore.setState({ items: {} });
  });

  it("should add and remove items", () => {
    const item = {
      animeId: "123",
      animeTitle: "My Hero Academia",
      status: "plan_to_watch" as const,
    };

    useWatchlistStore.getState().addItem(item);
    expect(useWatchlistStore.getState().items["123"]).toEqual(item);

    useWatchlistStore.getState().updateStatus("123", "watching");
    expect(useWatchlistStore.getState().items["123"].status).toBe("watching");

    useWatchlistStore.getState().removeItem("123");
    expect(useWatchlistStore.getState().items["123"]).toBeUndefined();
  });
});

describe("usePlayerStore", () => {
  beforeEach(() => {
    usePlayerStore.getState().resetPlayer();
  });

  it("should handle play episode actions", () => {
    usePlayerStore.getState().playEpisode("naruto-123", 5);
    expect(usePlayerStore.getState().animeId).toBe("naruto-123");
    expect(usePlayerStore.getState().episodeNumber).toBe(5);
    expect(usePlayerStore.getState().isPlaying).toBe(true);

    usePlayerStore.getState().setProgress(100);
    expect(usePlayerStore.getState().progressSeconds).toBe(100);

    usePlayerStore.getState().setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);

    usePlayerStore.getState().toggleMute();
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });
});
