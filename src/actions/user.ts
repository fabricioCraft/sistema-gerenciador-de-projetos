'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function updateUserAvatar(avatarUrl: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    await db.update(users)
        .set({ avatarUrl: avatarUrl })
        .where(eq(users.id, user.id));

    // Revalida todo o layout para atualizar o avatar no header/sidebar imediatamente
    revalidatePath('/', 'layout');

    return { success: true };
}

export async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return null;

    const user = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);

    if (user.length > 0) {
        return user[0];
    }

    // Se o usuário não existir no banco (primeiro acesso via OAuth ou Signup direto sem trigger),
    // cria registro inicial para garantir integridade.
    const [newUser] = await db.insert(users).values({
        id: authUser.id,
        email: authUser.email || '',
        fullName: authUser.user_metadata?.full_name || 'Usuário',
        avatarUrl: authUser.user_metadata?.avatar_url || null
    }).returning();

    return newUser;
}
