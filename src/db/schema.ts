import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // Assuming Supabase Auth uses UUIDs
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("planning"), // planning, active, completed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),

    // AI Cache
    aiInsight: text("ai_insight"),
    lastInsightAt: timestamp("last_insight_at", { withTimezone: true }),
});

export const tasks = pgTable("tasks", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").default("todo"), // todo, in_progress, done

    // Dates for Gantt
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),

    // PERT Data (in hours)
    estOptimistic: integer("est_optimistic"),
    estLikely: integer("est_likely"),
    estPessimistic: integer("est_pessimistic"),
    duration: integer("duration"),

    // Dependencies: Array of Task IDs
    dependencies: text("dependencies").array(),

    // Assignment & Priority
    assignedTo: text("assigned_to"), // User ID or name
    priority: text("priority"), // urgent, high, medium, low

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid("user_id"), // Implicitly references auth.users(id)
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

