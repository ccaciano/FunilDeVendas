import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get deal counts for each client
    const clientsWithDeals = await Promise.all(
      clients.map(async (client) => {
        const deals = await ctx.db
          .query("deals")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .collect();
        
        const activeDeals = deals.filter(d => 
          d.stage !== "closed_won" && d.stage !== "closed_lost"
        );
        
        const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
        
        return {
          ...client,
          activeDeals: activeDeals.length,
          totalValue,
        };
      })
    );

    return clientsWithDeals;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("clients", {
      ...args,
      userId,
    });
  },
});

export const get = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const client = await ctx.db.get(args.id);
    if (!client || client.userId !== userId) {
      throw new Error("Client not found");
    }

    return client;
  },
});
