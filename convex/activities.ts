import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByDeal = query({
  args: { dealId: v.id("deals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("activities")
      .withIndex("by_deal", (q) => q.eq("dealId", args.dealId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("note")
    ),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Update deal's last contact date
    await ctx.db.patch(args.dealId, {
      lastContactDate: Date.now(),
    });

    return await ctx.db.insert("activities", {
      ...args,
      date: Date.now(),
      userId,
    });
  },
});
