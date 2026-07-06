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
