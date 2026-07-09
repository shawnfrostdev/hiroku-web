# The Ultimate Anime Platform Architecture

This is the complete, high-performance tech stack designed to build a top-tier, community-driven anime streaming web app. It is separated into distinct layers to ensure that the app remains lightning-fast, secure, and scalable.

---

## 1. The Core Engine

* **Next.js (App Router)**: The overarching full-stack framework. It handles the routing (like `/anime/[id]`), Server-Side Rendering (so pages load instantly and have perfect SEO for anime titles), and API generation.
* **Bun**: The runtime and package manager. It replaces Node.js and NPM. It installs packages in milliseconds, runs scripts instantly, and makes your local development environment ridiculously fast.

---

## 2. Frontend & User Interface

* **Tailwind CSS**: The styling engine. It allows you to build custom, beautiful dark-mode designs directly in your markup without writing separate CSS files.
* **Radix UI**: The unstyled component foundation. It provides the complex logic for accessible dropdowns, modals, and tooltips without forcing a specific design on you.
* **Motion (Framer Motion)**: The animation engine. This handles the buttery-smooth page transitions, carousel slides, and micro-interactions (like a heart icon bursting when added to a watchlist).
* **Lucide**: The icon library. Clean, consistent, and lightweight vector icons for your entire interface.

---

## 3. State & Data Management

* **Zustand**: The client-side state manager. It remembers what episode the user is currently watching, manages the video player controls, and handles "optimistic UI updates" (updating the screen instantly before the server confirms a change).
* **TanStack Query (React Query)**: *(Optional but highly recommended)* Handles fetching, caching, and background-updating the massive amounts of anime metadata you will pull from external APIs.
* **Fribb's Anime Lists**: The anime mapping service (https://github.com/Fribb/anime-lists). It maps anime identifiers between various databases (such as MyAnimeList, AniList, Kitsu, AniDB, etc.) allowing unified catalog search and cross-platform metadata resolution.

---

## 4. Backend & Database (The Community Layer)

* **Neon (Serverless Postgres)**: The database. It scales instantly and stores all your relational data: User profiles, custom watchlists, comments, and continue-watching timestamps.
* **Drizzle ORM**: The bridge between your Next.js code and your Neon database. It lets you write extremely fast, entirely type-safe database queries. If you change a database column, Drizzle ensures your code won't compile until you fix the related UI.

---

## 5. Security & Authentication

* **Clerk**: The authentication system. Drop-in React components for beautifully styled Login, Sign-Up, and User Profile pages. It handles passwords, Google/Discord logins, and session security effortlessly.
* **Arcjet**: The runtime security layer. Embedded directly in your Next.js code, it protects your API routes from being spammed by bots, stops scrapers from stealing your data, and rate-limits malicious traffic.

---

## 6. Code Quality & Testing

* **Biome**: The formatter and linter. It replaces ESLint and Prettier, formatting your code and catching errors in a fraction of a millisecond.
* **Zod**: The validation schema. It checks all data entering your app (like a user submitting a comment) to guarantee it perfectly matches your database rules before ever attempting to save it.
* **Vitest & MSW**: The testing suite. Vitest runs unit tests at lightning speed, while Mock Service Worker (MSW) intercepts network requests so you can test how your app handles external anime API failures.
* **Husky**: The Git hook tool. It ensures that nobody (including AI agents) can commit code that breaks the Biome rules or fails Zod validation.

---

## How It All Works Together (Example: Adding to a Watchlist)

1. A user is on an anime page (Next.js) and clicks "Add to Watchlist".
2. The UI instantly updates the button to a filled state using Zustand.
3. A Next.js Server Action is triggered in the background.
4. Clerk verifies the user is securely logged in.
5. Arcjet verifies the request isn't coming from a spam bot.
6. Zod validates the anime ID being sent.
7. Drizzle ORM inserts the anime ID into the Neon Postgres database under that user's profile.