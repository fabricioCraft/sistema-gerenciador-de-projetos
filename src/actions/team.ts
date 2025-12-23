'use server';

import { db } from '@/db';
import { projectMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function inviteMember(projectId: string, email: string) {
    // 1. Verifica se já está no time
    const existing = await db.select()
        .from(projectMembers)
        .where(and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.email, email.toLowerCase())
        ))
        .limit(1);

    if (existing.length > 0) {
        return { error: "Usuário já convidado." };
    }

    // 2. Verifica se o usuário já existe na plataforma (public.users)
    const existingUsers = await db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

    const existingUser = existingUsers[0] || null;

    // 3. Cria o convite
    await db.insert(projectMembers).values({
        projectId,
        email: email.toLowerCase(),
        userId: existingUser ? existingUser.id : null,
        status: existingUser ? 'active' : 'pending',
        role: 'member'
    });

    revalidatePath(`/dashboard/${projectId}`);
    return { success: true };
}

export async function removeMember(memberId: string, projectId: string) {
    await db.delete(projectMembers).where(eq(projectMembers.id, memberId));
    revalidatePath(`/dashboard/${projectId}`);
    return { success: true };
}

export async function getProjectMembers(projectId: string) {
    const members = await db.select({
        id: projectMembers.id,
        email: projectMembers.email,
        role: projectMembers.role,
        status: projectMembers.status,
        invitedAt: projectMembers.invitedAt,
        userId: projectMembers.userId,
        userName: users.fullName,
        userAvatar: users.avatarUrl,
    })
        .from(projectMembers)
        .leftJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, projectId));

    return members;
}
