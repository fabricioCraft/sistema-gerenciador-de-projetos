'use server';

import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns';

// --- Projects ---

export async function createProject(name: string, description: string, userId: string = '00000000-0000-0000-0000-000000000000') {
    try {
        const [newProject] = await db.insert(projects).values({
            name,
            description,
            userId,
            status: 'planning'
        }).returning();

        // revalidatePath('/dashboard');
        return { success: true, data: newProject };
    } catch (error) {
        console.error('Failed to create project:', error);
        return { success: false, error: 'Failed to create project' };
    }
}

export async function getProject(id: string) {
    try {
        const project = await db.query.projects.findFirst({
            where: eq(projects.id, id),
        });

        if (!project) return { success: false, error: 'Project not found' };

        // Fetch tasks as well
        const projectTasks = await db.query.tasks.findMany({
            where: eq(tasks.projectId, id),
            orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
        });

        return { success: true, data: { ...project, tasks: projectTasks } };
    } catch (error) {
        console.error('Failed to fetch project:', error);
        return { success: false, error: 'Failed to fetch project' };
    }
}

// --- Tasks ---

export type CreateTaskInput = {
    projectId: string;
    title: string;
    description?: string;
    estOptimistic: number;
    estLikely: number;
    estPessimistic: number;
    dependencies?: string[];
};

function calculatePert(o: number, m: number, p: number) {
    return Math.ceil((o + (4 * m) + p) / 6);
}

export async function createTask(input: CreateTaskInput) {
    try {
        const duration = calculatePert(input.estOptimistic, input.estLikely, input.estPessimistic);

        const [newTask] = await db.insert(tasks).values({
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            estOptimistic: input.estOptimistic,
            estLikely: input.estLikely,
            estPessimistic: input.estPessimistic,
            duration,
            dependencies: input.dependencies || [],
            status: 'todo'
        }).returning();

        revalidatePath(`/dashboard/${input.projectId}`, 'layout');
        return { success: true, data: newTask };
    } catch (error) {
        console.error('Failed to create task:', error);
        return { success: false, error: 'Failed to create task' };
    }
}

export async function updateTaskStatus(taskId: string, status: string) {
    try {
        const [updatedTask] = await db.update(tasks)
            .set({ status })
            .where(eq(tasks.id, taskId))
            .returning();

        if (updatedTask) {
            revalidatePath(`/dashboard/${updatedTask.projectId}`, 'layout');
        }
        return { success: true, data: updatedTask };
    } catch (error) {
        return { success: false, error: 'Failed to update status' };
    }
}

// --- Scheduler Engine ---

// Recursive function to propagate changes
async function propagateChange(parentId: string, deltaMs: number, tx: any) {
    // Find direct dependents: tasks where dependencies array contains parentId
    const dependents = await tx
        .select()
        .from(tasks)
        .where(sql`${tasks.dependencies} @> ARRAY[${parentId}]::text[]`);

    for (const child of dependents) {
        if (!child.startDate || !child.endDate) continue;

        const childStart = new Date(child.startDate);
        const childEnd = new Date(child.endDate);

        // Apply same delta
        const updatedStart = new Date(childStart.getTime() + deltaMs);
        const updatedEnd = new Date(childEnd.getTime() + deltaMs);

        await tx.update(tasks)
            .set({ startDate: updatedStart, endDate: updatedEnd })
            .where(eq(tasks.id, child.id));

        console.log(`Cascading: Task ${child.title} moved by ${deltaMs / (1000 * 60 * 60 * 24)} days.`);

        // Recurse
        await propagateChange(child.id, deltaMs, tx);
    }
}

// Debugging: Removing transaction temporarily to isolate Supabase Pooler issues with prepared statements in transactions
export async function updateTaskAndPropagate(taskId: string, newStart: Date, newEnd: Date) {
    try {
        console.log(`Starting update for task ${taskId}: ${newStart.toISOString()} - ${newEnd.toISOString()}`);

        // 1. Get original task to calculate delta
        const [original] = await db.select().from(tasks).where(eq(tasks.id, taskId));
        if (!original) throw new Error("Task not found");

        // Handle potential null dates in DB
        const originalStart = original.startDate ? new Date(original.startDate) : newStart;
        const delta = newStart.getTime() - originalStart.getTime();

        console.log(`Delta calculated: ${delta}ms`);

        // 2. Update target task
        await db.update(tasks)
            .set({ startDate: newStart, endDate: newEnd })
            .where(eq(tasks.id, taskId));

        // 3. Propagate if there is a change
        if (delta !== 0) {
            console.log("Starting propagation...");
            await propagateChange(taskId, delta, db);
        }

        revalidatePath(`/dashboard/${original.projectId}`, 'layout');
        return { success: true, message: 'Schedule updated successfully' };
    } catch (error: any) {
        console.error("Update failed FULL ERROR:", JSON.stringify(error, null, 2));
        return { success: false, error: error.message || 'Unknown DB Error' };
    }
}

export async function auditSchedule(projectId: string) {
    try {
        const today = startOfDay(new Date());

        const overdueTasks = await db.query.tasks.findMany({
            where: (t, { and, sql }) => and(
                eq(t.projectId, projectId),
                sql`${t.endDate} < ${today.toISOString()}`,
                sql`${t.status} != 'done'`
            )
        });

        const suggestions = overdueTasks.map(t => {
            const proposedEnd = addDays(today, 2);
            return {
                taskId: t.id,
                taskTitle: t.title,
                currentEnd: t.endDate,
                proposedEnd: proposedEnd,
                delay: differenceInCalendarDays(today, t.endDate!)
            };
        });

        return { success: true, data: suggestions };
    } catch (error) {
        console.error("Audit failed:", error);
        return { success: false, error: 'Failed to audit schedule' };
    }
}
