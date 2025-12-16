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
        const sessions = await db
            .select()
            .from(chatSessions)
            .where(eq(chatSessions.projectId, projectId))
            .orderBy(desc(chatSessions.updatedAt));

        return { success: true, data: sessions };
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
