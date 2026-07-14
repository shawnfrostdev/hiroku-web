import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchlistItem {
  animeId: string;
  animeTitle: string;
  animeImage?: string;
  status: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";
  currentEpisode?: number;
  progressSeconds?: number;
  duration?: number;
  updatedAt?: number;
}

interface WatchlistState {
  items: Record<string, WatchlistItem>;
  addItem: (item: WatchlistItem) => void;
  removeItem: (animeId: string) => void;
  updateStatus: (animeId: string, status: WatchlistItem["status"]) => void;
  updateProgress: (
    animeId: string,
    currentEpisode: number,
    progressSeconds?: number,
    duration?: number,
  ) => void;
  setItems: (items: WatchlistItem[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      items: {},
      addItem: (item) =>
        set((state) => ({
          items: {
            ...state.items,
            [item.animeId]: {
              ...(state.items[item.animeId] || {}),
              ...item,
              updatedAt: Date.now(),
            },
          },
        })),
      removeItem: (animeId) =>
        set((state) => {
          const newItems = { ...state.items };
          delete newItems[animeId];
          return { items: newItems };
        }),
      updateProgress: (animeId, currentEpisode, progressSeconds, duration) =>
        set((state) => {
          const item = state.items[animeId];
          if (!item) return {};
          return {
            items: {
              ...state.items,
              [animeId]: {
                ...item,
                currentEpisode,
                progressSeconds: progressSeconds ?? item.progressSeconds,
                duration: duration ?? item.duration,
                updatedAt: Date.now(),
              },
            },
          };
        }),
      updateStatus: (animeId, status) =>
        set((state) => {
          const item = state.items[animeId];
          if (!item) return {};
          return {
            items: {
              ...state.items,
              [animeId]: { ...item, status, updatedAt: Date.now() },
            },
          };
        }),
      setItems: (itemsList) =>
        set(() => {
          const itemsMap: Record<string, WatchlistItem> = {};
          for (const item of itemsList) {
            itemsMap[item.animeId] = item;
          }
          return { items: itemsMap };
        }),
    }),
    {
      name: "hiroku-watchlist",
    },
  ),
);
