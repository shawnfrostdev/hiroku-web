import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  clerkId: text("clerk_id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const watchlistStatusEnum = pgEnum("watchlist_status", [
  "watching",
  "completed",
  "on_hold",
  "dropped",
  "plan_to_watch",
]);

export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull(),
  animeTitle: text("anime_title").notNull(),
  animeImage: text("anime_image"),
  status: watchlistStatusEnum("status").default("plan_to_watch").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const continueWatching = pgTable("continue_watching", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.clerkId, { onDelete: "cascade" }),
  animeId: text("anime_id").notNull(),
  episodeNumber: integer("episode_number").notNull(),
  progressSeconds: integer("progress_seconds").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  watchlists: many(watchlists),
  comments: many(comments),
  continueWatching: many(continueWatching),
}));

export const watchlistsRelations = relations(watchlists, ({ one }) => ({
  user: one(users, {
    fields: [watchlists.userId],
    references: [users.clerkId],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.clerkId],
  }),
}));

export const continueWatchingRelations = relations(
  continueWatching,
  ({ one }) => ({
    user: one(users, {
      fields: [continueWatching.userId],
      references: [users.clerkId],
    }),
  }),
);
