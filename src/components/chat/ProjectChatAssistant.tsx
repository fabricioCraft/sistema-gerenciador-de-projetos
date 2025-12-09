'use client';

import { useChat } from '@ai-sdk/react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Bot } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';

export function ProjectChatAssistant({ projectId }: { projectId: string }) {
    const chat = useChat({
        api: '/api/chat',
        streamProtocol: 'text', // Re-enabled to match backend toTextStreamResponse
        body: { projectId: projectId || 'unknown-project' }, // Passa o ID real do projeto
        onResponse: (response: any) => {
            console.log("📡 useChat onResponse status:", response.status);
        },
        onError: (err: any) => {
            console.error("❌ Erro no useChat:", err);
            alert("Erro no Chat: " + err.message);
        },
        onFinish: (message: any) => {
            console.log("✅ Stream finalizado. Última mensagem:", message);
        },
    } as any) as any;

    const { messages, status, sendMessage: chatSendMessage, error } = chat as any;
    const isLoading = status === 'streaming' || status === 'submitted';
    
    // Prioritize chatSendMessage if available, otherwise check for append (though logs say it's not there)
    const sendMessage = typeof chatSendMessage === 'function' 
        ? chatSendMessage 
        : (typeof (chat as any).append === 'function' ? (chat as any).append : async () => {
             console.error("No send function found. Keys:", Object.keys(chat));
             alert("Erro crítico: Função de envio não encontrada.");
        });

    // Expose chat to window for debugging
    useEffect(() => {
        (window as any)._chatDebug = chat;
        console.log("Chat Hook Initialized. Keys available:", Object.keys(chat));
    }, [chat]);

    const [inputValue, setInputValue] = useState('');

    // console.log("Chat object keys:", Object.keys(chat || {}));
    console.log("Mensagens atuais:", messages);

    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!inputValue?.trim()) return;

        const message = { role: 'user', content: inputValue };
        
        // Clear input immediately for better UX
        setInputValue('');
        
        try {
            await sendMessage(message);
        } catch (err) {
            console.error("Error sending message:", err);
            // Optionally restore input or show error
        }
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

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
                <SheetHeader className="p-4 border-b bg-slate-50 dark:bg-slate-900">
                    <SheetTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-600" />
                        Assistente de Projeto
                    </SheetTitle>
                    <SheetDescription>
                        Gerente virtual conectado ao cronograma.
                    </SheetDescription>
                </SheetHeader>

                <div className="bg-yellow-100 p-2 text-xs text-black border-b border-yellow-300">
                    <p>Status Debug:</p>
                    <p>Qtd Mensagens: {messages.length}</p>
                    <p>Erro atual: {error ? error.message : 'Nenhum'}</p>
                    {/* Mostra o JSON bruto para vermos se chega algo */}
                    <pre className="max-h-20 overflow-auto">{JSON.stringify(messages, null, 2)}</pre>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bot className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="font-medium">Olá! Eu conheço todas as tarefas.</p>
                            <p className="text-sm mt-2">Pergunte: "Qual a próxima entrega?" ou "O que está atrasado?"</p>
                        </div>
                    )}
                    {messages.map((m: any, index: number) => (
                                <div key={m.id || index} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {m.role !== 'user' && (
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <Bot className="w-4 h-4 text-slate-600" />
                                        </div>
                                    )}
                                    <div className={`rounded-lg p-3 max-w-[80%] text-sm shadow-sm ${m.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-100 text-slate-900 border border-slate-200'
                                        }`}>
                                        <p>{m.content}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{JSON.stringify(m)}</p>
                                    </div>
                                </div>
                            ))}
                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-slate-600" />
                            </div>
                            <div className="rounded-lg p-3 bg-slate-50 border border-slate-100 text-sm text-slate-500 animate-pulse">
                                Analisando...
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
                        <Button type="submit" size="icon" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
}
