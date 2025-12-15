import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(), // Assuming Supabase Auth uses UUIDs
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("planning"), // planning, active, completed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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

