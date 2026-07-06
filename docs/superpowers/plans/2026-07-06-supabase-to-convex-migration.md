# Supabase → Convex Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dead Supabase database with a Convex backend that serves the 34 wedding letters to both the English and Chinese frontends, with zero visible change to the guest experience.

**Architecture:** One Convex deployment (cloud project "letters") owns a single `letters` table plus a public `getByCode` query. The backend code (`convex/`) lives in the English repo `youve-got-mail`. Both frontends call the same deployment imperatively via a `ConvexHttpClient` on button click — a drop-in replacement for the single Supabase `.from("letters").select("message").eq("code",…)` call. The Chinese repo is a pure client (no `convex/` folder), referencing the shared function by name.

**Tech Stack:** Convex, React 18, Vite 6, TypeScript, `convex/browser` (`ConvexHttpClient`), `convex/server` (`makeFunctionReference`).

## Global Constraints

- Convex project (cloud): **letters** (already created by the user).
- Backend `convex/` folder lives ONLY in `youve-got-mail` (English repo).
- Chinese repo (`youve-got-mail-chinese`) has NO `convex/` folder; it references the shared function by name via `makeFunctionReference<"query">("letters:getByCode")`.
- Both apps read the deployment URL from `import.meta.env.VITE_CONVEX_URL` (set in each repo's gitignored `.env.local`).
- 34 letters total: 27 English + 7 Chinese. Codes are 6-char strings (phone-number suffixes) — keep `code` a STRING, never a number (leading zeros / exact match matter).
- Preserve exact existing UI, animation, copy, and control flow. The ONLY behavioral change is the data source. English error text stays `"Invalid code. Please try again."`; Chinese stays `"验证码错误，请重试。"`.
- Do NOT touch `~/src/tries/Animate Scene Sequence` (unrelated Figma export).
- Source dump: `~/Downloads/Boblynlim Project Backup Dec 23 2025.gz`. Decompressed copy already at `/private/tmp/claude-501/-Users-jazulynn-src-tries-Animate-Scene-Sequence/f54852de-8c5a-4bc3-929f-7ddbb26ae201/scratchpad/backup_dump.raw` (regenerate with `gunzip -c` if missing).

---

### Task 1: Convex backend — schema + query (English repo)

**Files:**
- Modify: `youve-got-mail/package.json` (add `convex` dep — done by installer)
- Create: `youve-got-mail/convex/schema.ts`
- Create: `youve-got-mail/convex/letters.ts`
- Generated (by `convex dev`): `youve-got-mail/convex/_generated/*`, `.env.local` gets `CONVEX_DEPLOYMENT` + `VITE_CONVEX_URL`

**Interfaces:**
- Produces: query `api.letters.getByCode({ code: string }) => { message: string } | null`, referenceable by name as `"letters:getByCode"`.

- [ ] **Step 1: Install Convex in the English repo**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npm install convex
```

- [ ] **Step 2: Write the schema**

Create `youve-got-mail/convex/schema.ts`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  letters: defineTable({
    code: v.string(),
    message: v.string(),
    name: v.optional(v.string()),
    sent: v.optional(v.boolean()),
  }).index("by_code", ["code"]),
});
```

- [ ] **Step 3: Write the query**

Create `youve-got-mail/convex/letters.ts`:

```ts
import { query } from "./_generated/server";
import { v } from "convex/values";

// Public: look up a single letter by its access code (phone-number suffix).
// Mirrors the old Supabase `.from("letters").select("message").eq("code", code).single()`.
export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const letter = await ctx.db
      .query("letters")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    return letter ? { message: letter.message } : null;
  },
});
```

- [ ] **Step 4: Start Convex dev and link to the "letters" project (USER ACTION REQUIRED)**

This is the one-time browser login. Run in the English repo:

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npx convex dev --once
```

- On first run it opens a browser to log in — the user approves it.
- When prompted to choose a project, select the EXISTING cloud project **letters** (do NOT create a new one).
- `--once` pushes the functions and generates `convex/_generated/`, then exits (no long-running watcher needed for the plan).

Expected: `convex/_generated/api.d.ts` exists, and `.env.local` now contains `CONVEX_DEPLOYMENT=...` and `VITE_CONVEX_URL=https://<name>.convex.cloud`.

- [ ] **Step 5: Verify the deployment URL was written**

```bash
grep VITE_CONVEX_URL "/Users/jazulynn/src/tries/letters/youve-got-mail/.env.local"
```

Expected: one line `VITE_CONVEX_URL=https://<something>.convex.cloud`. Record this value — Task 4 needs it for the Chinese repo.

- [ ] **Step 6: Commit backend code**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
git add convex package.json package-lock.json
git commit -m "feat: add Convex backend (letters schema + getByCode query)"
```

Note: `.env.local` and `convex/_generated/` are gitignored by Convex's defaults / existing `.gitignore` — do not force-add them.

---

### Task 2: Migrate the 34 letters into Convex

**Files:**
- Create: `youve-got-mail/scripts/parse_letters.py` (one-off migration parser)
- Create (gitignored artifact): `youve-got-mail/scripts/letters.jsonl`

**Interfaces:**
- Consumes: `letters` table + deployment from Task 1.
- Produces: 34 documents in the `letters` table.

- [ ] **Step 1: Write the dump parser**

Create `youve-got-mail/scripts/parse_letters.py`:

```python
#!/usr/bin/env python3
"""Extract public.letters rows from the Supabase pg_dump COPY block into JSONL."""
import json, sys

DUMP = sys.argv[1] if len(sys.argv) > 1 else (
    "/private/tmp/claude-501/-Users-jazulynn-src-tries-Animate-Scene-Sequence/"
    "f54852de-8c5a-4bc3-929f-7ddbb26ae201/scratchpad/backup_dump.raw"
)
OUT = sys.argv[2] if len(sys.argv) > 2 else "scripts/letters.jsonl"

def unescape(field):
    if field == r"\N":
        return None
    out, i = [], 0
    while i < len(field):
        c = field[i]
        if c == "\\" and i + 1 < len(field):
            nxt = field[i + 1]
            out.append({"n": "\n", "t": "\t", "r": "\r", "\\": "\\"}.get(nxt, nxt))
            i += 2
        else:
            out.append(c)
            i += 1
    return "".join(out)

rows, in_block = [], False
with open(DUMP, encoding="utf-8") as f:
    for line in f:
        if line.startswith("COPY public.letters ("):
            in_block = True
            continue
        if in_block:
            if line.startswith("\\."):
                break
            parts = line.rstrip("\n").split("\t")  # cols: code, message, name, sent
            code, message, name, sent = (unescape(p) for p in parts)
            doc = {"code": code, "message": message}
            if name is not None:
                doc["name"] = name
            if sent is not None:
                doc["sent"] = (sent == "t")
            rows.append(doc)

with open(OUT, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

print(f"wrote {len(rows)} rows to {OUT}")
```

- [ ] **Step 2: Run the parser and verify the count is 34**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
python3 scripts/parse_letters.py
wc -l scripts/letters.jsonl
```

Expected: `wrote 34 rows to scripts/letters.jsonl` and `34 scripts/letters.jsonl`. If not 34, STOP and inspect the dump block before importing.

- [ ] **Step 3: Spot-check one English and one Chinese letter in the JSONL**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
grep '"code": "259987"' scripts/letters.jsonl   # peiwen (English), sent=true
grep '"code": "902570"' scripts/letters.jsonl   # mummy (Chinese)
```

Expected: the English row contains real `\n` escapes rendered as JSON `\n` and readable English text; the Chinese row (`902570`) contains CJK characters. Confirm no literal backslash-n artifacts remain in the decoded text (JSON `\n` is correct; `\\n` is wrong).

- [ ] **Step 4: Import into Convex**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npx convex import --table letters scripts/letters.jsonl
```

Answer `y` to confirm. Expected: "Imported 34 documents into table letters" (or similar success).

- [ ] **Step 5: Verify the data in Convex**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npx convex run letters:getByCode '{"code":"259987"}'
npx convex run letters:getByCode '{"code":"902570"}'
npx convex run letters:getByCode '{"code":"000000"}'
```

Expected: `259987` returns `{ "message": "hellus peiwen!!\n\n..." }` with real newlines; `902570` returns a message containing Chinese characters; `000000` returns `null`.

- [ ] **Step 6: Commit the migration script**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
echo "scripts/letters.jsonl" >> .gitignore
git add scripts/parse_letters.py .gitignore
git commit -m "chore: add letters migration parser (Supabase dump -> Convex)"
```

Note: `letters.jsonl` contains the real letter contents — keep it OUT of git (added to `.gitignore` above).

---

### Task 3: Swap English frontend Supabase → Convex

**Files:**
- Create: `youve-got-mail/src/convexClient.ts`
- Modify: `youve-got-mail/src/App.tsx` (line 7 import; lines 138–147 query block)
- Delete: `youve-got-mail/src/supabaseClient.ts`

**Interfaces:**
- Consumes: `api.letters.getByCode` from Task 1; `VITE_CONVEX_URL` from Task 1 Step 5.

- [ ] **Step 1: Create the Convex client**

Create `youve-got-mail/src/convexClient.ts`:

```ts
import { ConvexHttpClient } from "convex/browser";

export const convex = new ConvexHttpClient(
  import.meta.env.VITE_CONVEX_URL as string,
);
```

- [ ] **Step 2: Swap the import in App.tsx**

In `youve-got-mail/src/App.tsx`, replace line 7:

```ts
import { supabase } from "./supabaseClient";
```

with:

```ts
import { convex } from "./convexClient";
import { api } from "../convex/_generated/api";
```

- [ ] **Step 3: Swap the query block in App.tsx**

In `youve-got-mail/src/App.tsx`, replace the body of `handleOpenLetter` (the Supabase call, lines ~138–150):

```ts
        // Check if code exists in Supabase database
        const { data, error: dbError } = await supabase
          .from("letters")
          .select("message")
          .eq("code", enteredCode)
          .single();

        if (dbError || !data) {
          setError("Invalid code. Please try again.");
        } else {
          setLetterContent(data.message);
          setError("");
          setPage("letter");
        }
```

with:

```ts
        // Look up the letter in Convex by access code
        const data = await convex.query(api.letters.getByCode, {
          code: enteredCode,
        });

        if (!data) {
          setError("Invalid code. Please try again.");
        } else {
          setLetterContent(data.message);
          setError("");
          setPage("letter");
        }
```

- [ ] **Step 4: Delete the dead Supabase client and dependency**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
rm src/supabaseClient.ts
npm uninstall @supabase/supabase-js
```

- [ ] **Step 5: Verify it builds and typechecks**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npm run build
```

Expected: build succeeds with no reference-to-`supabase` errors and no missing `api` import.

- [ ] **Step 6: Manually verify the flow**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npm run dev
```

In the browser: skip/через the intro → enter code `259987` → the intro animation plays → peiwen's letter renders with correct line breaks. Then reload, enter `000000` → "Invalid code. Please try again." appears.

- [ ] **Step 7: Commit**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
git add -A
git commit -m "feat: read letters from Convex instead of Supabase"
```

---

### Task 4: Swap Chinese frontend Supabase → Convex

**Files:**
- Create: `youve-got-mail-chinese/src/convexClient.ts`
- Create: `youve-got-mail-chinese/.env.local` (add `VITE_CONVEX_URL`)
- Modify: `youve-got-mail-chinese/src/App.tsx` (line 7 import; lines 138–147 query block)
- Delete: `youve-got-mail-chinese/src/supabaseClient.ts`

**Interfaces:**
- Consumes: the SAME deployment as Task 1 via `VITE_CONVEX_URL`; the shared function `"letters:getByCode"`.

- [ ] **Step 1: Install Convex (client only — no `convex dev`, no `convex/` folder)**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail-chinese"
npm install convex
```

- [ ] **Step 2: Point the Chinese app at the shared deployment**

Append to `youve-got-mail-chinese/.env.local` the SAME URL recorded in Task 1 Step 5 (replace `<name>`):

```
VITE_CONVEX_URL=https://<name>.convex.cloud
```

- [ ] **Step 3: Create the Convex client with a by-name function reference**

Create `youve-got-mail-chinese/src/convexClient.ts`:

```ts
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";

export const convex = new ConvexHttpClient(
  import.meta.env.VITE_CONVEX_URL as string,
);

// This repo has no convex/ folder; reference the shared deployment's function by name.
export const getByCode = makeFunctionReference<"query", { code: string }, { message: string } | null>(
  "letters:getByCode",
);
```

- [ ] **Step 4: Swap the import in App.tsx**

In `youve-got-mail-chinese/src/App.tsx`, replace line 7:

```ts
import { supabase } from "./supabaseClient";
```

with:

```ts
import { convex, getByCode } from "./convexClient";
```

- [ ] **Step 5: Swap the query block in App.tsx**

In `youve-got-mail-chinese/src/App.tsx`, replace the Supabase call in `handleOpenLetter` (lines ~138–150):

```ts
        // Check if code exists in Supabase database
        const { data, error: dbError } = await supabase
          .from("letters")
          .select("message")
          .eq("code", enteredCode)
          .single();

        if (dbError || !data) {
          setError("验证码错误，请重试。");
        } else {
          setLetterContent(data.message);
          setError("");
          setPage("letter");
        }
```

with:

```ts
        // Look up the letter in Convex by access code (shared deployment)
        const data = await convex.query(getByCode, { code: enteredCode });

        if (!data) {
          setError("验证码错误，请重试。");
        } else {
          setLetterContent(data.message);
          setError("");
          setPage("letter");
        }
```

- [ ] **Step 6: Delete the dead Supabase client and dependency**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail-chinese"
rm src/supabaseClient.ts
npm uninstall @supabase/supabase-js
```

- [ ] **Step 7: Verify build + flow**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail-chinese"
npm run build
npm run dev
```

In the browser: enter code `902570` (mummy, Chinese) → the Chinese letter renders with correct CJK text and line breaks. Enter `000000` → `验证码错误，请重试。` appears.

- [ ] **Step 8: Commit**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail-chinese"
git add -A
git commit -m "feat: read letters from shared Convex deployment instead of Supabase"
```

---

### Task 5: Final end-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Confirm both apps hit the same data**

Run each app's dev server and confirm:
- English app: code `259987` → English letter; code `902570` → the Chinese "mummy" letter renders too (same shared table).
- Chinese app: code `902570` → Chinese letter; code `259987` → English letter renders too.
- Both: a wrong code shows the correct localized error.

- [ ] **Step 2: Confirm no Supabase references remain**

```bash
grep -rn -i "supabase" \
  "/Users/jazulynn/src/tries/letters/youve-got-mail/src" \
  "/Users/jazulynn/src/tries/letters/youve-got-mail-chinese/src"
```

Expected: no matches.

- [ ] **Step 3: Confirm letter count in Convex is exactly 34**

```bash
cd "/Users/jazulynn/src/tries/letters/youve-got-mail"
npx convex run letters:getByCode '{"code":"259987"}'   # sanity: still returns peiwen
```

(Optionally check the Convex dashboard `letters` table shows 34 rows.)

---

## Self-Review

**Spec coverage:**
- Convex schema `letters` + `by_code` index → Task 1 Steps 2–3. ✓
- Public `getByCode` query mirroring Supabase select → Task 1 Step 3. ✓
- Seed 34 rows with escape handling + verify count/spot-check → Task 2. ✓
- English frontend swap, preserve UI/copy → Task 3. ✓
- Chinese frontend swap as pure client via `makeFunctionReference`, preserve `验证码错误，请重试。` → Task 4. ✓
- Both apps share one `VITE_CONVEX_URL` / deployment → Task 1 Step 5 + Task 4 Step 2. ✓
- Leave `Animate Scene Sequence` untouched → not referenced in any task. ✓
- One-time Convex login flagged → Task 1 Step 4. ✓

**Placeholder scan:** No TBD/TODO; all code and commands are concrete. `<name>` in the deployment URL is an intentional runtime value recorded in Task 1 Step 5.

**Type consistency:** `getByCode` returns `{ message: string } | null` everywhere (Task 1 Step 3, Task 4 Step 3 reference type, both App.tsx consumers read `data.message` after a truthy check). `code` is a string throughout.
