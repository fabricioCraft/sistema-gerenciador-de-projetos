'use server';

import { db } from '@/db';
import { chatSessions, chatMessages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createChatSession(projectId: string, title: string = 'Nova Conversa') {
    try {
        const [session] = await db.insert(chatSessions).values({
            projectId,
            title,
        }).returning();

        revalidatePath(`/project/${projectId}`);
        return { success: true, session };
    } catch (error) {
        console.error('Failed to create chat session:', error);
        return { success: false, error: 'Failed to create chat session' };
    }
}

export async function getChatSessions(projectId: string) {
    try {
        // Fetch sessions and filter out empty ones locally or via query.
        // Assuming we want to show only sessions that have at least one message.
        // We can do a subquery or just fetch and filter if the volume is low.
        // Let's use the efficient 'inArray' approach if possible, or just join.
        // Actually, let's fetch sessions that have messages.

        // Simple distinct subquery logic
        const activeSessionIds = await db
            .select({ sessionId: chatMessages.sessionId })
            .from(chatMessages)
            .groupBy(chatMessages.sessionId);

        const activeIds = activeSessionIds.map(s => s.sessionId).filter(Boolean) as string[];

        if (activeIds.length === 0) {
            return { success: true, data: [] };
        }

        const sessions = await db
            .select()
            .from(chatSessions)
            .where(
                // Combining conditions: ProjectID AND SessionID in activeIds
                // Using and() from drizzle-orm but need to import it or just method chaining?
                // Drizzle where takes one expression usually, need 'and'.
                // Let's import 'and' and 'inArray'.
                // If imports are missing, I'll add them.
                eq(chatSessions.projectId, projectId)
            )
            .orderBy(desc(chatSessions.updatedAt));

        // Filter in memory for simplicity if 'inArray' or 'and' is tricky without seeing imports
        const validSessions = sessions.filter(s => activeIds.includes(s.id));

        return { success: true, data: validSessions };
    } catch (error) {
        console.error('Failed to get chat sessions:', error);
        return { success: false, error: 'Failed to get chat sessions' };
    }
}

export async function getChatMessages(sessionId: string) {
    try {
        const messages = await db
            .select()
            .from(chatMessages)
            .where(eq(chatMessages.sessionId, sessionId))
            .orderBy(chatMessages.createdAt);

        return { success: true, data: messages };
    } catch (error) {
        console.error('Failed to get chat messages:', error);
        return { success: false, error: 'Failed to get chat messages' };
    }
}

export async function deleteChatSession(sessionId: string) {
    try {
        await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
        // Since we don't know the projectId here easily without fetching, we might not revalidate perfectly 
        // or we assume the caller handles UI updates or we return the projectId.
        return { success: true };
    } catch (error) {
        console.error('Failed to delete chat session:', error);
        return { success: false, error: 'Failed to delete session' };
    }
}

export async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
    try {
        const [message] = await db.insert(chatMessages).values({
            sessionId,
            role,
            content,
        }).returning();

        // Update session timestamp
        await db.update(chatSessions)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessions.id, sessionId));

        return { success: true, message };
    } catch (error) {
        console.error('Failed to save message:', error);
        return { success: false, error: 'Failed to save message' };
    }
}

export async function updateChatSessionTitle(sessionId: string, newTitle: string) {
    try {
        await db.update(chatSessions)
            .set({ title: newTitle })
            .where(eq(chatSessions.id, sessionId));

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to update session title:', error);
        return { success: false, error: 'Failed to update title' };
    }
}
