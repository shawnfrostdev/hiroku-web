import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchlistItem {
  animeId: string;
  animeTitle: string;
  animeImage?: string;
  status: "watching" | "completed" | "on_hold" | "dropped" | "plan_to_watch";
}

interface WatchlistState {
  items: Record<string, WatchlistItem>;
  addItem: (item: WatchlistItem) => void;
  removeItem: (animeId: string) => void;
  updateStatus: (animeId: string, status: WatchlistItem["status"]) => void;
  setItems: (items: WatchlistItem[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      items: {},
      addItem: (item) =>
        set((state) => ({
          items: { ...state.items, [item.animeId]: item },
        })),
      removeItem: (animeId) =>
        set((state) => {
          const newItems = { ...state.items };
          delete newItems[animeId];
          return { items: newItems };
        }),
      updateStatus: (animeId, status) =>
        set((state) => {
          const item = state.items[animeId];
          if (!item) return {};
          return {
            items: {
              ...state.items,
              [animeId]: { ...item, status },
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
