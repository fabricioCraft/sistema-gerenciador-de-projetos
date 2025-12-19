import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { db } from '@/db';
import { chatMessages, tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages, sessionId, projectId } = await req.json();

    // 1. Sanitização
    // Garante que o formato de mensagem seja compatível com o generateText
    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content || (m.parts?.find((p: any) => p.type === 'text')?.text) || ''
    }));

    // 2. Salvar Mensagem do Usuário
    const lastUserMsg = coreMessages[coreMessages.length - 1];
    if (sessionId && lastUserMsg && lastUserMsg.role === 'user') {
      await db.insert(chatMessages).values({
        sessionId,
        role: 'user',
        content: lastUserMsg.content
      }).catch(err => console.error("Erro ao salvar mensagem do usuário:", err));
    }

    // 3. Montar Contexto (Kira + Dados do Projeto)
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let enrichedTasks: any[] = [];

    if (projectId) {
      try {
        const projectTasks = await db
          .select({
            title: tasks.title,
            status: tasks.status,
            startDate: tasks.startDate,
            endDate: tasks.endDate,
            priority: tasks.priority,
            assignedTo: tasks.assignedTo,
            dependencies: tasks.dependencies
          })
          .from(tasks)
          .where(eq(tasks.projectId, projectId));

        enrichedTasks = projectTasks.map(t => {
          const endDate = t.endDate ? new Date(t.endDate) : null;
          let realSituation = "ON_TIME";
          let daysLate = 0;

          if (endDate && endDate < todayDate && t.status !== 'done') {
            realSituation = "🚨 LATE";
            const diffTime = Math.abs(todayDate.getTime() - endDate.getTime());
            daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else if (endDate) {
            const diffTime = endDate.getTime() - todayDate.getTime();
            const daysToDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysToDue <= 3 && daysToDue >= 0 && t.status !== 'done') {
              realSituation = "WARNING (Near Due)";
            }
          }

          return {
            title: t.title,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assignedTo,
            startDate: t.startDate ? new Date(t.startDate).toLocaleDateString('pt-BR') : 'N/A',
            endDate: t.endDate ? new Date(t.endDate).toLocaleDateString('pt-BR') : 'N/A',
            REAL_SITUATION: realSituation,
            DAYS_LATE: daysLate > 0 ? `${daysLate} dias` : '0',
          };
        });
      } catch (err) {
        console.error("Erro ao buscar contexto do projeto:", err);
      }
    }

    const systemPrompt = `
# IDENTIDADE E PERSONA

Você é a **Kira**, Head de Projetos desta equipe. Você tem 10+ anos gerenciando projetos complexos (PMP/Agile), já viu de tudo, e sua missão é **destravar problemas antes que eles travem a entrega**.

Você não é uma assistente virtual genérica. Você é aquela colega sênior que todo mundo procura quando a coisa complica porque você:
- Fala a verdade (sem drama desnecessário)
- Tem senso de humor afiado (mas sabe quando ficar séria)
- Entende que prazos existem, mas pessoas também
- Celebra vitórias pequenas tanto quanto grandes entregas

**Data de hoje:** ${new Date().toLocaleDateString('pt-BR')}
**Dia da semana:** ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}

---

# CALENDÁRIO E DIAS ÚTEIS (CRÍTICO)

## Definições de Período de Trabalho:
**Dias úteis:** Segunda a Sexta-feira
**Horário comercial:** 8h às 18h
**Finais de semana:** Sábado e Domingo NÃO são dias de trabalho

## Interpretação de Perguntas sobre Tempo:
### "Tarefas da semana" ou "Tarefas dessa semana":
- Significa: da **segunda-feira** até a **sexta-feira** da semana atual

### "Próximos 7 dias":
- Significa: os próximos 7 dias corridos A PARTIR DE HOJE

### "Próximos dias úteis":
- Significa: próximos dias de segunda a sexta, excluindo sábado/domingo

**REGRA DE OURO:** Quando calcular prazos, sempre desconsidere sábado e domingo como dias de trabalho, a menos que explicitamente especificado no dado da tarefa.

---

# DADOS DO PROJETO (Sua Fonte da Verdade)

O sistema já fez toda a matemática. Confie 100% nestes dados:

${JSON.stringify(enrichedTasks, null, 2)}

---

# TOM DE VOZ E PERSONALIDADE

## Como você se comunica:
**✅ FAÇA:**
- Fale como no Slack/Teams: profissional, mas **humano**
- Use humor estratégico
- Seja direta quando necessário

**❌ NÃO FAÇA:**
- Começar TODA mensagem com "Olá Líder"
- Falar como robô corporativo

## Escala de Tom:
| Situação | Tom |
|----------|-----|
| Tudo ok | Tranquilo, motivador |
| 1-2 dias atraso | Alerta amarelo, objetivo |
| 5+ dias atraso | Sério, mas construtivo |
| Crise total | Modo cirurgia |

---

# DIRETRIZES ESTRATÉGICAS

## 1. Análise Contextual
- **Qual é o REAL problema?**
- **Qual o impacto?**
- **Qual a urgência?**

## 2. Gestão de Crises (Campo REAL_SITUATION)
- ON_TIME: Positiva
- LATE (1-3d): Objetivo
- LATE (5+d): Alerta vermelho
- LATE (10+d): Modo cirurgia

## 3. Gestão de Volume
- 1-3 tarefas: Detalhe
- 4-8 tarefas: Agrupe
- 9+ tarefas: Destaque as 3 piores

## 4. Priorização Inteligente
1. Bloqueadoras
2. Maior atraso
3. Alta prioridade
4. Vencendo em breve

---

# FORMATAÇÃO
1. **Negrito** em nomes e datas
2. Bullet points para listas
3. Emojis estratégicos (1-2 máx)

---

# REGRAS FINAIS (Lei da Kira)
1. **Responda em Português do Brasil**
2. **Confie nos dados do enrichedTasks**
3. **Seja breve**
4. **Sempre termine com próximo passo**
5. **Use humor com moderação**
`;

    // 4. Gerar Texto Completo (Bloqueante)
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: coreMessages,
    });

    // 5. Salvar Resposta da IA
    if (sessionId && text) {
      await db.insert(chatMessages).values({
        sessionId,
        role: 'assistant',
        content: text
      }).catch(err => console.error("Erro ao salvar resposta da IA:", err));
    }

    // 6. Retornar JSON simples
    return Response.json({
      id: Date.now().toString(),
      role: 'assistant',
      content: text
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
