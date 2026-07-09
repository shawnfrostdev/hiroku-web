# Hiroku Implementation Roadmap

This file tracks the next steps for building the **Hiroku** anime streaming platform.

## Completed Steps
- [x] **Initialize Next.js Project** (TypeScript, Bun, Tailwind CSS v4, Biome, App Router in `src/` directory)
- [x] **Install Dependencies** (Radix UI, Framer Motion, Lucide React, Zustand, TanStack Query, Neon Serverless Postgres, Drizzle ORM, Clerk, Arcjet, Zod, Vitest, MSW, Husky)
- [x] **Developer Environment & Tooling Config**:
  - Configure Biome for formatting and linting (`biome.json`).
  - Configure Husky git pre-commit hooks to run Biome formatting and check before commit.
  - Configure Vitest testing configuration (`vitest.config.ts`), add test scripts to `package.json`, and verify smoke tests run with zero warnings/errors.
- [x] **Database Setup (Neon & Drizzle)**:
  - Database connection helper configured at `/src/lib/db.ts` utilizing `@neondatabase/serverless` and Drizzle ORM.
  - Relational schema defined at `/src/db/schema.ts` including Users, Watchlists, Comments, and ContinueWatching.
  - Drizzle configuration defined at `/drizzle.config.ts`.
  - Added schema validation tests in `/src/__tests__/db.test.ts` (100% passing).
- [x] **Authentication & Middleware (Clerk & Arcjet)**:
  - Configured Clerk auth provider in `/src/app/layout.tsx`.
  - Built unified request proxy at `/src/proxy.ts` (Next.js 16 Proxy convention) managing bot protection, client-IP rate limiting, and auth route protection.
  - Setup login and signup pages in `/src/app/sign-in` and `/src/app/sign-up` using Clerk's primitives.
- [x] **Application Providers & State Management (TanStack Query & Zustand)**:
  - Created client-side data-fetching provider at `/src/providers/QueryProvider.tsx` and wrapped the main application layout.
  - Initialized Zustand store for optimistic watchlist actions at `/src/store/useWatchlistStore.ts`.
  - Initialized Zustand store for media player states and actions at `/src/store/usePlayerStore.ts`.
  - Added unit tests in `/src/__tests__/store.test.ts` (100% passing).

- [x] **Design System & Global Styles (Tailwind CSS v4 & Radix & Framer Motion)**:
  - Integrated primary Google Font (Outfit) and custom HSL system-wide color parameters in `/src/app/globals.css`.
  - Built premium, accessible, and animated UI components: `Button`, `Dialog`, `DropdownMenu`, and `Tooltip` combining Radix UI and Framer Motion micro-animations.
  - Added CSS and UI component unit tests in `/src/__tests__/ui.test.tsx` (100% passing).
- [x] **Anime Mapping Integration**:
  - Built helper utilities at `/src/lib/animeLists.ts` to fetch, cache, and query Fribb's anime-lists mapping databases to resolve metadata and IDs between AniList, MAL, Kitsu, etc.
  - Added unit tests in `/src/__tests__/animeLists.test.ts` (100% passing).

---

## Future Steps

### 7. Core Features & Pages
- [ ] **Home Page / Dashboard**: Modern, interactive homepage with carousels (Framer Motion) showcasing popular/seasonal anime.
- [ ] **Search & Catalog**: Fast client-side filtering and pagination powered by TanStack Query.
- [ ] **Anime Detail & Player Page**: Media player interface that tracks timestamps and triggers "continue-watching" database writes.
- [ ] **Watchlist & User Profile**: Page displaying user-saved watchlists with optimistic UI updates.
- [ ] **Community / Comments**: Relational comment threads on episode pages.

### 8. Verification & Testing
- [ ] **Write Tests**: Implement unit and mock tests with Vitest and MSW.
- [ ] **End-to-End Checklist**: Validate build correctness, page load performance, and SEO.
