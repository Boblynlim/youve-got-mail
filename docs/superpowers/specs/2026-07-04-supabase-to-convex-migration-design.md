# Supabase → Convex Migration: "You've Got Mail" Letters

**Date:** 2026-07-04
**Status:** Approved design, ready for implementation plan

## Background

A wedding thank-you letters app. Each guest enters the last 6 digits of their phone
number as a "code" and is shown a personal letter with an intro animation.

The backing database (Supabase project `eqnkdijrcrsauclyuplo`) died. A full cluster
dump exists at `~/Downloads/Boblynlim Project Backup Dec 23 2025.gz`. The only
application data in it is one table:

```
public.letters (code text NOT NULL, message text NOT NULL, name text, sent boolean)  -- 34 rows
```

All Supabase system tables (auth, storage, realtime, vault) are empty. Of the 34
letters, 27 are English and 7 are Chinese (mummy, xh mom, xh dad, Dayi, Dayi Zhang,
Er Yi, Ryan).

There are **two fully-built frontends**, both git repos under `~/src/tries/letters/`:

- `youve-got-mail` — English
- `youve-got-mail-chinese` — 你有新邮件

Both point at the **same** Supabase project and the **same** `letters` table via an
identical query. They are one shared dataset with two language-skinned UIs.

The `~/src/tries/Animate Scene Sequence` folder is an early Figma export of just the
intro animation — NOT the real app. It is out of scope; leave it untouched.

## Goal

Replace the dead Supabase database with Convex, restoring both apps to working order,
with zero visible change to the guest experience.

## Decisions (confirmed with user)

1. Migrate **both** frontends against **one shared** Convex backend.
2. The Convex backend (`convex/` folder) lives **inside the English repo**
   (`youve-got-mail`). The Chinese app points its `VITE_CONVEX_URL` at the same
   deployment.

## Design

### Backend (Convex, in `youve-got-mail/convex/`)

- **Schema** — table `letters`:
  - `code: v.string()`
  - `message: v.string()`
  - `name: v.optional(v.string())`
  - `sent: v.optional(v.boolean())`
  - Index `by_code` on `["code"]`.
- **Query** — `letters.getByCode({ code: string })`:
  - Looks up via the `by_code` index, returns the first match as `{ message }`
    (mirrors the old `.select("message").eq("code", code).single()`), or `null` if
    no match.
  - Public (no auth), matching the old Supabase `anon` access.
- **Data migration**:
  - Parse the 34 rows out of the `COPY public.letters ... FROM stdin;` block in the
    dump.
  - Convert Postgres escapes: `\n` → real newline, `\t` → tab, `\N` → null/omitted.
  - Emit `letters.jsonl` (one JSON object per line) and load with `npx convex import
    --table letters letters.jsonl`.
  - **Verify:** row count == 34; spot-check one English letter (e.g. code `259987`,
    "peiwen") and one Chinese letter (e.g. code `902570`, "mummy") match the dump,
    including newlines.

### Frontend changes (each repo)

The only database touchpoint is one block in `src/App.tsx`:

```js
const { data, error: dbError } = await supabase
  .from("letters").select("message").eq("code", enteredCode).single();
if (dbError || !data) { setError("Invalid code. Please try again."); }
else { setLetterContent(data.message); setError(""); setPage("letter"); }
```

Migration per repo:

1. Add `convex` dependency; remove `@supabase/supabase-js` usage.
2. Replace `src/supabaseClient.ts` with a Convex client (`ConvexReactClient` using
   `import.meta.env.VITE_CONVEX_URL`).
3. Wrap `<App />` in `<ConvexProvider>` in `src/main.tsx`.
4. Replace the query block with a Convex call to `letters.getByCode`. Preserve the
   exact same control flow, the "Invalid code. Please try again." error text, and the
   `setLetterContent` / `setPage("letter")` behavior.
5. Both repos set the **same** `VITE_CONVEX_URL` in their env.

The Chinese repo does **not** own or deploy any Convex backend. It is a pure client of
the shared deployment: it sets the same `VITE_CONVEX_URL` and calls the function by
name via `makeFunctionReference<"query">("letters:getByCode")` (no generated types, no
`convex/` folder, no schema duplication). Only `youve-got-mail` owns `convex/`.

### Behavior parity

- Same UI, animation, fonts, and copy.
- Same query semantics: exact `code` match → letter's `message`; no match → error.
- No auth, storage, realtime, or admin — none existed in usable form.

## Operational notes

- Convex requires a **one-time browser login**. The user runs `npx convex dev` and
  approves in the browser. Claude will signal exactly when.
- **Security note (informational):** codes are 6-digit numeric (phone suffixes),
  brute-forceable (~1M space, 34 valid). Acceptable for a wedding site — "unlisted,"
  not "secured." No change unless the user wants one.

## Out of scope (YAGNI)

- The `Animate Scene Sequence` folder.
- Auth / storage / realtime / admin panels.
- Any redesign of the guest-facing experience.

## Verification

- `npx convex run` / dashboard shows 34 letters; `getByCode` returns correct message
  for a known English and a known Chinese code, and `null` for a bogus code.
- Each app runs (`npm run dev`), a real code reveals the correct letter with newlines
  intact, and a wrong code shows the error.
