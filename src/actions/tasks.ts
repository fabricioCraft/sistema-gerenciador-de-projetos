'use server';

import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateTaskStatus(taskId: string, newStatus: string) {
    try {
        // According to instructions, if there was a completed_at field we would set it. 
        // Current schema doesn't have it, so we just update status.
        // Validating status could be good but we'll trust the input for now or cast it.

        const [updatedTask] = await db.update(tasks)
            .set({ status: newStatus })
            .where(eq(tasks.id, taskId))
            .returning();

        if (updatedTask) {
            revalidatePath(`/dashboard/${updatedTask.projectId}`, 'layout');
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to update task status:', error);
        return { success: false, error: 'Failed to update task status' };
    }
}
