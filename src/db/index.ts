import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

// Debug (para confirmar se o Next.js leu o arquivo)
console.log('🔗 Conectando ao DB:', connectionString.replace(/:[^:@]*@/, ':***@'));

// Configuração CRÍTICA para Supabase Pooler (Porta 6543)
const client = postgres(connectionString, {
    prepare: false, // Necessário para Transaction Pooler
    ssl: 'require'  // Necessário para conexão segura
});

export const db = drizzle(client, { schema });
