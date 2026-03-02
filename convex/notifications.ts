import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUnread = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_unread", (q) => q.eq("userId", userId).eq("isRead", false))
      .filter((q) => q.lte(q.field("scheduledFor"), Date.now()))
      .collect();

    // Get deal and client info for each notification
    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        const deal = await ctx.db.get(notification.dealId);
        const client = await ctx.db.get(notification.clientId);
        return {
          ...notification,
          deal,
          client,
        };
      })
    );

    return notificationsWithDetails;
  },
});

export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found");
    }

    await ctx.db.patch(args.id, { isRead: true });
  },
});

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const activeDeals = deals.filter(d => 
      d.stage !== "closed_won" && d.stage !== "closed_lost"
    );

    const totalValue = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
    const weightedValue = activeDeals.reduce((sum, deal) => 
      sum + (deal.value * deal.probability / 100), 0
    );

    const stageStats = {
      lead: deals.filter(d => d.stage === "lead").length,
      qualified: deals.filter(d => d.stage === "qualified").length,
      proposal: deals.filter(d => d.stage === "proposal").length,
      negotiation: deals.filter(d => d.stage === "negotiation").length,
      closed_won: deals.filter(d => d.stage === "closed_won").length,
      closed_lost: deals.filter(d => d.stage === "closed_lost").length,
    };

    const overdueDeals = activeDeals.filter(deal => 
      deal.nextFollowUpDate && deal.nextFollowUpDate < Date.now()
    ).length;

    return {
      totalDeals: activeDeals.length,
      totalValue,
      weightedValue,
      stageStats,
      overdueDeals,
    };
  },
});
