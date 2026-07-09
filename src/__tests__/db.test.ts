import { describe, expect, it } from "vitest";
import * as schema from "@/db/schema";

describe("Database Schema Definitions", () => {
  it("should have a users table with expected columns", () => {
    expect(schema.users).toBeDefined();
    expect(schema.users.clerkId).toBeDefined();
    expect(schema.users.email).toBeDefined();
    expect(schema.users.username).toBeDefined();
    expect(schema.users.avatarUrl).toBeDefined();
  });

  it("should have a watchlists table with expected columns", () => {
    expect(schema.watchlists).toBeDefined();
    expect(schema.watchlists.id).toBeDefined();
    expect(schema.watchlists.userId).toBeDefined();
    expect(schema.watchlists.animeId).toBeDefined();
    expect(schema.watchlists.animeTitle).toBeDefined();
    expect(schema.watchlists.status).toBeDefined();
  });

  it("should have comments and continueWatching tables", () => {
    expect(schema.comments).toBeDefined();
    expect(schema.continueWatching).toBeDefined();
  });

  it("should have watchlist status enum configured", () => {
    expect(schema.watchlistStatusEnum).toBeDefined();
    expect(schema.watchlistStatusEnum.enumValues).toContain("watching");
    expect(schema.watchlistStatusEnum.enumValues).toContain("plan_to_watch");
  });
});
