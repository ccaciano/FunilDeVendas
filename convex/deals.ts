import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get client info for each deal
    const dealsWithClients = await Promise.all(
      deals.map(async (deal) => {
        const client = await ctx.db.get(deal.clientId);
        return {
          ...deal,
          client,
        };
      })
    );

    return dealsWithClients;
  },
});

export const getByStage = query({
  args: { stage: v.union(
    v.literal("lead"),
    v.literal("qualified"),
    v.literal("proposal"),
    v.literal("negotiation"),
    v.literal("closed_won"),
    v.literal("closed_lost")
  )},
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deals = await ctx.db
      .query("deals")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    const dealsWithClients = await Promise.all(
      deals.map(async (deal) => {
        const client = await ctx.db.get(deal.clientId);
        return {
          ...deal,
          client,
        };
      })
    );

    return dealsWithClients;
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    title: v.string(),
    value: v.number(),
    expectedCloseDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const dealId = await ctx.db.insert("deals", {
      ...args,
      stage: "lead",
      probability: 10,
      lastContactDate: Date.now(),
      userId,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      dealId,
      clientId: args.clientId,
      type: "note",
      description: `Nova negociação criada: ${args.title}`,
      date: Date.now(),
      userId,
    });

    return dealId;
  },
});

export const updateStage = mutation({
  args: {
    id: v.id("deals"),
    stage: v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    probability: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deal = await ctx.db.get(args.id);
    if (!deal || deal.userId !== userId) {
      throw new Error("Deal not found");
    }

    await ctx.db.patch(args.id, {
      stage: args.stage,
      probability: args.probability,
      lastContactDate: Date.now(),
    });

    // Create activity log
    await ctx.db.insert("activities", {
      dealId: args.id,
      clientId: deal.clientId,
      type: "stage_change",
      description: `Estágio alterado para: ${getStageLabel(args.stage)}`,
      date: Date.now(),
      userId,
    });
  },
});

export const scheduleFollowUp = mutation({
  args: {
    id: v.id("deals"),
    followUpDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const deal = await ctx.db.get(args.id);
    if (!deal || deal.userId !== userId) {
      throw new Error("Deal not found");
    }

    await ctx.db.patch(args.id, {
      nextFollowUpDate: args.followUpDate,
      notes: args.notes,
      lastContactDate: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId,
      dealId: args.id,
      clientId: deal.clientId,
      type: "follow_up",
      message: `Lembrete: entrar em contato sobre "${deal.title}"`,
      isRead: false,
      scheduledFor: args.followUpDate,
    });

    // Create activity log
    await ctx.db.insert("activities", {
      dealId: args.id,
      clientId: deal.clientId,
      type: "note",
      description: `Follow-up agendado para ${new Date(args.followUpDate).toLocaleDateString()}${args.notes ? `: ${args.notes}` : ''}`,
      date: Date.now(),
      userId,
    });
  },
});

function getStageLabel(stage: string): string {
  const labels = {
    lead: "Lead",
    qualified: "Qualificado",
    proposal: "Proposta",
    negotiation: "Negociação",
    closed_won: "Fechado - Ganho",
    closed_lost: "Fechado - Perdido",
  };
  return labels[stage as keyof typeof labels] || stage;
}
