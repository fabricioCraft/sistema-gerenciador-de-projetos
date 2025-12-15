import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, projectId } = body;

    // 1. CONVERSÃO MANUAL DE MENSAGENS (Sanitização)
    const coreMessages = messages.map((m: any) => {
      let content = '';
      if (m.parts && Array.isArray(m.parts)) {
        content = m.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text)
          .join('');
      } else if (typeof m.content === 'string') {
        content = m.content;
      }
      return { role: m.role, content };
    });

    // 2. BUSCAR CONTEXTO DO PROJETO E ENRIQUECIMENTO DE DADOS
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Zera hora para comparação justa
    const todayString = todayDate.toLocaleDateString('pt-BR');

    let projectContextJson = "[]";

    if (projectId) {
      try {
        const projectTasks = await db
          .select({
            title: tasks.title,
            status: tasks.status, // todo, in_progress, done
            startDate: tasks.startDate,
            endDate: tasks.endDate,
            priority: tasks.priority, // urgent, high, medium, low
            assignedTo: tasks.assignedTo,
            dependencies: tasks.dependencies
          })
          .from(tasks)
          .where(eq(tasks.projectId, projectId));

        // Pré-processamento e Enriquecimento de Dados (Data Enrichment)
        // A IA é ruim de matemática de datas, então calculamos o status real aqui.
        const sanitizedTasks = projectTasks.map(t => {
          const endDate = t.endDate ? new Date(t.endDate) : null;
          let realSituation = "No Prazo";
          let daysLate = 0;

          // Lógica de Atraso IDÊNTICA ao Dashboard
          if (endDate && endDate < todayDate && t.status !== 'done') {
            realSituation = "🚨 ATRASADO"; // Emoji ajuda a IA a focar
            // Calcula dias de atraso
            const diffTime = Math.abs(todayDate.getTime() - endDate.getTime());
            daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else if (endDate) {
            // Verifica se vence em breve (próximos 3 dias)
            const diffTime = endDate.getTime() - todayDate.getTime();
            const daysToDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysToDue <= 3 && daysToDue >= 0 && t.status !== 'done') {
              realSituation = "⚠️ Atenção (Vence em breve)";
            }
          }

          return {
            title: t.title,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assignedTo,
            // Datas formatadas para leitura humana
            startDate: t.startDate ? new Date(t.startDate).toLocaleDateString('pt-BR') : 'N/A',
            endDate: t.endDate ? new Date(t.endDate).toLocaleDateString('pt-BR') : 'N/A',
            // DADOS ENRIQUECIDOS PARA A IA NÃO ALUCINAR
            REAL_SITUATION: realSituation,
            DAYS_LATE: daysLate > 0 ? `${daysLate} dias` : '0',
          };
        });

        projectContextJson = JSON.stringify(sanitizedTasks, null, 2);
      } catch (err) {
        console.error("Erro ao buscar contexto do projeto:", err);
      }
    }

    const systemPrompt = `
# IDENTIDADE
Seu nome é Kira. Você é a Inteligência Central de Gestão de Projetos.
Hoje é ${todayString}.

# ANÁLISE PRÉ-PROCESSADA DO BANCO DE DADOS (DADOS MESTRE)
Abaixo está a lista oficial de tarefas.
O sistema já calculou os atrasos para você. **Você NÃO deve tentar calcular datas mentalmente.**

${projectContextJson}

# DIRETRIZES CRÍTICAS DE "REALIDADE":
1. **Regra de Ouro:** Olhe EXCLUSIVAMENTE para o campo 'REAL_SITUATION' de cada tarefa.
2. Se estiver escrito 'ATRASADO' (ou 🚨), você **OBRIGATORIAMENTE** deve alertar o usuário.
3. Use o formato: "A tarefa **[Titulo]** está atrasada há **[X] dias**." (Use o campo 'DAYS_LATE').
4. Não suavize a situação. Se está atrasado, diga.

# TOM DE VOZ
- Profissional, direto e data-driven.
- "Líder, temos X tarefas atrasadas que precisam de atenção."

Responda sempre em Português do Brasil.
`;

    // 3. CHAMADA À IA
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: coreMessages,
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("ERRO FATAL API CHAT:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
