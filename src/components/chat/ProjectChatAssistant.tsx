'use client';

import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState, useMemo } from 'react';

export function ProjectChatAssistant({ projectId }: { projectId: string }) {
    const [inputValue, setInputValue] = useState('');

    // Cria transport que usa Text Stream (compatível com toTextStreamResponse())
    const transport = useMemo(() => new TextStreamChatTransport({
        api: '/api/chat',
        body: { projectId }
    }), [projectId]);

    // useChat v5 - usa 'id' e 'sendMessage'
    const chatHelpers = useChat({
        id: `project-${projectId}`,
        transport,
        onError: (err) => {
            console.error("❌ Erro no useChat:", err);
        },
        onFinish: (message) => {
            console.log("✅ Stream finalizado. Última mensagem:", message);
        },
    });

    const { messages, status, sendMessage, error } = chatHelpers;
    const isLoading = status === 'streaming' || status === 'submitted';

    // Expose chat to window for debugging
    useEffect(() => {
        (window as any)._chatDebug = chatHelpers;
        console.log("Chat Hook Initialized. Keys:", Object.keys(chatHelpers));
    }, [chatHelpers]);

    console.log("Mensagens atuais:", messages);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue?.trim()) return;

        const messageContent = inputValue;
        setInputValue(''); // Clear input immediately

        try {
            // sendMessage v5 usa { text: string }
            await sendMessage({ text: messageContent });
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Helper para extrair texto de uma mensagem (v5 usa parts)
    const getMessageText = (m: typeof messages[0]): string => {
        if (m.parts) {
            return m.parts
                .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                .map(p => p.text)
                .join('');
        }
        return '';
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white z-50 transition-all hover:scale-105 items-center justify-center flex"
                    aria-label="Assistente de Projeto"
                >
                    <MessageSquare className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 h-full" side="right">
                <SheetHeader className="p-4 border-b bg-indigo-50/50 dark:bg-slate-900/50">
                    <SheetTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                        <Bot className="w-5 h-5" />
                        Falar com Kira
                    </SheetTitle>
                    <SheetDescription>
                        Head de Projetos Inteligente.
                    </SheetDescription>
                </SheetHeader>

                <div className="bg-yellow-100 p-2 text-xs text-black border-b border-yellow-300">
                    <p>Status Debug:</p>
                    <p>Qtd Mensagens: {messages.length}</p>
                    <p>isLoading: {isLoading ? 'Sim' : 'Não'}</p>
                    <p>Erro atual: {error ? error.message : 'Nenhum'}</p>
                    <pre className="max-h-20 overflow-auto">{JSON.stringify(messages, null, 2)}</pre>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 mt-10 p-6">
                            <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                <Bot className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">👋 Sou a Kira.</h3>
                            <p className="text-sm leading-relaxed max-w-[280px] mx-auto">
                                Estou monitorando seu cronograma em tempo real.
                                <br /><br />
                                <span className="font-medium text-indigo-600 dark:text-indigo-400">Experimente perguntar:</span>
                                <br /> "O que está atrasado?"
                                <br /> "Qual o foco da semana?"
                            </p>
                        </div>
                    )}
                    {messages.map((m, index) => (
                        <div key={m.id || index} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <span className="text-[10px] text-slate-400 px-1">
                                {m.role === 'user' ? 'Você' : 'Kira'}
                            </span>
                            <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {m.role !== 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                                        <Bot className="w-4 h-4 text-indigo-600" />
                                    </div>
                                )}
                                <div className={`rounded-2xl p-3 text-sm shadow-sm ${m.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-bl-none'
                                    }`}>
                                    <p className="leading-relaxed">{getMessageText(m)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start items-center ml-1">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                                <Bot className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="px-3 py-2 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-500 animate-pulse italic">
                                Kira está digitando...
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                <div className="p-4 border-t bg-white dark:bg-slate-950">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !inputValue?.trim()} className="bg-blue-600 hover:bg-blue-700">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
