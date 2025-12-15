'use server';

import { generateObject, generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { db } from '@/db';
import { projects, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { calculateProjectSchedule } from './scheduler';

const TaskSchema = z.object({
    title: z.string(),
    description: z.string(),
    estOptimistic: z.number().describe('Optimistic estimate in hours'),
    estLikely: z.number().describe('Most likely estimate in hours'),
    estPessimistic: z.number().describe('Pessimistic estimate in hours'),
    dependencies: z.array(z.number()).describe('Array of indices of tasks that this task depends on (0-based index in this list)'),
});

const ProjectSchema = z.object({
    name: z.string(),
    description: z.string(),
    tasks: z.array(TaskSchema),
});

function calculatePert(o: number, m: number, p: number) {
    return Math.ceil((o + (4 * m) + p) / 6);
}

export async function generateAndCreateProject(userDescription: string) {
    try {
        const { object: projectPlan } = await generateObject({
            model: openai('gpt-5-mini'),
            schema: ProjectSchema,
            prompt: `
        Você é um Gerente de Projetos PMP certificado. 
        Crie uma Estrutura Analítica do Projeto (EAP) detalhada para o seguinte projeto: "${userDescription}".
        
        Requisitos:
        1. Quebre em tarefas técnicas (desenvolvimento, design, infraestrutura).
        2. Estime o tempo (Otimista, Provável, Pessimista) em HORAS para cada tarefa.
        3. Defina dependências logicamente usando o índice da tarefa na lista.
        4. Garanta que o caminho crítico não seja trivial.
        5. Forneça um nome profissional para o projeto se não estiver implícito.
        
        Responda em Português do Brasil.
      `,
        });

        // 1. Create Project
        const TEST_USER_ID = "c4dfb583-c0d6-4898-bc01-5426475d7709"; // ID do admin manual

        const [newProject] = await db.insert(projects).values({
            name: projectPlan.name,
            description: projectPlan.description,
            status: 'planning',
            userId: TEST_USER_ID,
        }).returning();

        if (!newProject) throw new Error('Failed to create project record');

        // 2. Map tasks and calculate PERT
        const tasksData = projectPlan.tasks.map(t => ({
            projectId: newProject.id,
            title: t.title,
            description: t.description,
            estOptimistic: t.estOptimistic,
            estLikely: t.estLikely,
            estPessimistic: t.estPessimistic,
            duration: calculatePert(t.estOptimistic, t.estLikely, t.estPessimistic),
            status: 'todo' as const,
            originalIndex: 0 // Placeholder
        }));

        // Insert tasks and get returned IDs
        const createdTasks = await db.insert(tasks).values(tasksData).returning({ id: tasks.id });

        // 3. Update dependencies
        const updates = projectPlan.tasks.map((task, index) => {
            const taskUuid = createdTasks[index].id;
            const dependencyUuids = task.dependencies?.map(dIndex => createdTasks[dIndex]?.id).filter(Boolean) || [];

            if (dependencyUuids.length > 0) {
                return db.update(tasks)
                    .set({ dependencies: dependencyUuids })
                    .where(eq(tasks.id, taskUuid));
            }
            return null;
        }).filter(Boolean);

        if (updates.length > 0) {
            // @ts-ignore
            await Promise.all(updates);
        }

        // 4. Calculate and persist schedule (CPM/PERT dates)
        // This runs ONCE at project creation to fill start_date and end_date
        await calculateProjectSchedule(newProject.id);

        revalidatePath('/');
        return { success: true, projectId: newProject.id };

    } catch (error) {
        console.error('AI Project Generation Failed:', error);
        return { success: false, error: 'Failed to generate plan' };
    }
}

export async function generateDashboardInsight({
    total, todo, doing, done, overdue, critical_urgent, critical_safe
}: {
    total: number, todo: number, doing: number, done: number, overdue: number, critical_urgent: number, critical_safe: number
}) {
    try {
        const { text } = await generateText({
            model: openai('gpt-4o'),
            prompt: `
            # Prompt: Gerente de Projetos Sênior

            ## Persona
            Você é um Gerente de Projetos Sênior com mais de 30 anos de experiência liderando projetos complexos em diversas indústrias. Sua expertise está em análise pragmática de riscos, comunicação clara e objetiva, e na capacidade de distinguir ruído operacional de problemas reais que exigem ação imediata.

            ## Contexto de Análise
            Você receberá dados de saúde do projeto. Sua missão é avaliar a situação com base em décadas de experiência, identificando o que realmente importa e descartando falsos alarmes.

            ## Estrutura do Input
            - Total de Tarefas: ${total}
            - A Fazer: ${todo}
            - Em Andamento: ${doing}
            - Concluídas: ${done}
            - Atrasadas (${overdue}): Prioridade Crítica. Prazos já perdidos.
            - Críticas Urgentes (${critical_urgent}): ALERTA VERMELHO. Tarefas do caminho crítico vencendo em < 5 dias.
            - Críticas Planejadas (${critical_safe}): Backlog normal. Não é risco imediato.

            ## Diretrizes de Análise

            ### 1. Críticas Planejadas (${critical_safe})
            - **Ação:** NÃO tratar como problema. É apenas trabalho futuro.
            - **Tom:** Neutro.

            ### 2. Críticas Urgentes (${critical_urgent})
            - **Ação:** Se > 0, isso é o INCÊNDIO real. Exige ação imediata.

            ### 3. Atrasadas (${overdue})
            - **Ação:** Se > 0, exige correção imediata. Risco materializado.

            ## Tom de Voz

            ### Projeto Saudável (overdue = 0 E critical_urgent = 0)
            - **Status:** "Projeto SAUDÁVEL e SOB CONTROLE"
            - **Tom:** Confiante, tranquilizador.
            - Elogie o progresso se houver concuídas.

            ### Projeto em Risco (overdue > 0 OU critical_urgent > 0)
            - **Status:** Declare o problema claramente.
            - **Tom:** Direto, orientado à solução.

            ## Instrução de Saída
            Gere uma resposta curta (máximo 3 frases) em Português do Brasil.
            Não use markdown no output (apenas texto).
            Siga estritamente os fatos numéricos acima.
          `,
        });

        return { success: true, insight: text };
    } catch (error) {
        console.error('AI Insight Error:', error);
        return { success: false, insight: "Não foi possível gerar a análise no momento." };
    }
}
