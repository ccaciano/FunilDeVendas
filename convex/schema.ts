import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  clients: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    source: v.string(), // "website", "referral", "cold_call", etc.
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  deals: defineTable({
    clientId: v.id("clients"),
    title: v.string(),
    value: v.number(),
    stage: v.union(
      v.literal("lead"),
      v.literal("qualified"),
      v.literal("proposal"),
      v.literal("negotiation"),
      v.literal("closed_won"),
      v.literal("closed_lost")
    ),
    probability: v.number(), // 0-100
    expectedCloseDate: v.number(),
    lastContactDate: v.number(),
    nextFollowUpDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"])
    .index("by_stage", ["stage"])
    .index("by_follow_up", ["nextFollowUpDate"]),

  activities: defineTable({
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    type: v.union(
      v.literal("call"),
      v.literal("email"),
      v.literal("meeting"),
      v.literal("note"),
      v.literal("stage_change")
    ),
    description: v.string(),
    date: v.number(),
    userId: v.id("users"),
  })
    .index("by_deal", ["dealId"])
    .index("by_client", ["clientId"])
    .index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    dealId: v.id("deals"),
    clientId: v.id("clients"),
    type: v.union(
      v.literal("follow_up"),
      v.literal("overdue"),
      v.literal("stage_reminder")
    ),
    message: v.string(),
    isRead: v.boolean(),
    scheduledFor: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_scheduled", ["scheduledFor"])
    .index("by_unread", ["userId", "isRead"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
