'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { MessageSquare, Send, User, Bot, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export function ChatSidebar() {
    const params = useParams();
    const projectId = params.projectId as string;

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        body: { projectId },
        startOnMount: false, // Wait for user interaction? Or start based on logic.
    } as any) as any;

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full fixed bottom-8 right-8 h-14 w-14 shadow-2xl z-50 bg-blue-600 hover:bg-blue-700 text-white border-0">
                    <MessageSquare className="h-6 w-6" />
                    <span className="sr-only">Abrir chat</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5 text-blue-600" />
                        Gerente de Projetos IA
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 pr-4 mt-4">
                    <div className="flex flex-col gap-4 pb-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 mt-10">
                                <p>Olá! Eu sou seu Gerente PMP.</p>
                                <p className="text-sm">Peça para eu criar tarefas ou analisar o cronograma.</p>
                            </div>
                        )}
                        {messages.map((m: any) => (
                            <div
                                key={m.id}
                                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                            >
                                <div
                                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border ${m.role === 'user' ? 'bg-gray-100' : 'bg-blue-100'
                                        }`}
                                >
                                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div
                                    className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${m.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800'
                                        }`}
                                >
                                    {m.content}
                                    {m.toolInvocations?.map((toolInvocation: any) => {
                                        // Prevent rendering raw JSON, maybe brief summary
                                        return (
                                            <div key={toolInvocation.toolCallId} className="mt-2 text-xs bg-gray-500/10 p-2 rounded">
                                                Executando: {toolInvocation.toolName}...
                                                {'result' in toolInvocation && (
                                                    <div className="mt-1 font-mono">{JSON.stringify(toolInvocation.result)}</div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-blue-100">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                                <div className="rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800">
                                    Pensando...
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <form onSubmit={handleSubmit} className="flex w-full items-center gap-2 pt-4 border-t">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Pergunte ao PMP..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Enviar</span>
                    </Button>
                </form>
            </SheetContent>
        </Sheet>
    );
}
