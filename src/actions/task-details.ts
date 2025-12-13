'use server';

import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function deleteTask(taskId: string) {
    try {
        const [deletedTask] = await db.delete(tasks).where(eq(tasks.id, taskId)).returning();
        if (deletedTask) {
            revalidatePath(`/dashboard/${deletedTask.projectId}`, 'layout');
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to delete task:', error);
        return { success: false, error: 'Failed to delete task' };
    }
}

export async function updateTask(taskId: string, data: Partial<typeof tasks.$inferInsert>) {
    try {
        const [updatedTask] = await db.update(tasks).set(data).where(eq(tasks.id, taskId)).returning();
        if (updatedTask) {
            revalidatePath(`/dashboard/${updatedTask.projectId}`, 'layout');
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to update task:', error);
        return { success: false, error: 'Failed to update task' };
    }
}
