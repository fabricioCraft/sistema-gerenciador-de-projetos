'use server';

import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

        revalidatePath(`/dashboard/${input.projectId}`);
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

        return { success: true, data: updatedTask };
    } catch (error) {
        return { success: false, error: 'Failed to update status' };
    }
}
