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
