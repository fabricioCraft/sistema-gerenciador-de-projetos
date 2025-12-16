'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { createChatSession, getChatSessions, deleteChatSession } from '@/actions/chat-actions';
import { Bot, Send, Plus, MessageSquare, User, Sparkles, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function ProjectChatAssistant({ projectId }: { projectId: string }) {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Hook do Vercel AI SDK
    const chatHelpers = useChat() as any;

    const { messages, setMessages, append, sendMessage, isLoading } = chatHelpers;

    const [localInput, setLocalInput] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Carregar histórico
    useEffect(() => {
        if (projectId) {
            fetchHistory();
        }
    }, [projectId]);

    const fetchHistory = async () => {
        const sessions = await getChatSessions(projectId);
        if (sessions.success) {
            setHistory(sessions.data || []);
        }
    };

    // Função auxiliar para garantir sessão
    const ensureSession = async () => {
        if (currentSessionId) return currentSessionId;
        try {
            const newSession = await createChatSession(projectId);
            if (newSession.success && newSession.session) {
                setCurrentSessionId(newSession.session.id);
                fetchHistory(); // Atualiza a sidebar
                return newSession.session.id;
            }
            return null;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    // Envio de Mensagem
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!localInput?.trim() || isLoading) return;

        const text = localInput;
        setLocalInput('');

        const sessionId = await ensureSession();
        if (!sessionId) return;

        const sendFn = append || sendMessage;

        if (typeof sendFn !== 'function') {
            console.error("Critical Error: No send function found.", chatHelpers);
            alert("Erro crítico: O módulo de chat não inicializou corretamente. Verifique o console.");
            return;
        }

        try {
            await sendFn({ role: 'user', content: text }, {
                body: { projectId, sessionId }
            });
        } catch (err) {
            console.error("Error sending message:", err);
            // Fallback
            if (!append && sendMessage) {
                await sendMessage(text, { body: { projectId, sessionId } });
            }
        }
    };

    // Clique na Sugestão
    const handleSuggestionClick = async (text: string) => {
        const sessionId = await ensureSession();
        if (!sessionId) return;

        const sendFn = append || sendMessage;
        if (typeof sendFn !== 'function') return;

        try {
            await sendFn({ role: 'user', content: text }, {
                body: { projectId, sessionId }
            });
        } catch (e) {
            if (!append && sendMessage) {
                await sendMessage(text, { body: { projectId, sessionId } });
            }
        }
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir esta conversa?')) {
            const res = await deleteChatSession(id);
            if (res.success) {
                setHistory(prev => prev.filter(s => s.id !== id));
                if (currentSessionId === id) {
                    setCurrentSessionId(null);
                    setMessages([]);
                }
            }
        }
    };

    const handleSelectSession = (id: string) => {
        setCurrentSessionId(id);
        setMessages([]); // Limpa msg atual (Futuro: Carregar msg do banco)
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="group fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-4 pr-5 py-3 
                    bg-gradient-to-r from-blue-600 to-indigo-600 
                    hover:from-blue-500 hover:to-indigo-500 
                    text-white rounded-full 
                    shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)] 
                    hover:shadow-[0_0_30px_-5px_rgba(79,70,229,0.7)] 
                    border border-white/10 backdrop-blur-sm 
                    transition-all duration-300 ease-out 
                    hover:scale-105 active:scale-95">
                    <div className="relative flex items-center justify-center">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <span className="font-semibold text-sm tracking-wide">
                        Perguntar à Kira
                    </span>
                    <span className="flex h-3 w-3 absolute -top-1 -right-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                    </span>
                </button>
            </SheetTrigger>
            <SheetContent className="p-0 sm:max-w-[900px] w-[90vw] bg-slate-950 border-l border-slate-800 text-slate-100 flex flex-row h-full shadow-2xl">
                <SheetTitle className="sr-only">Assistente Kira</SheetTitle>

                {/* === SIDEBAR (ESQUERDA) === */}
                <div className="w-[260px] flex-shrink-0 border-r border-slate-800 bg-slate-950/50 flex flex-col h-full hidden md:flex">
                    <div className="p-4 border-b border-slate-800 h-16 flex items-center">
                        <Button
                            onClick={() => { setCurrentSessionId(null); setMessages([]); }}
                            className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20 font-medium"
                        >
                            <Plus className="w-4 h-4" /> Nova Conversa
                        </Button>
                    </div>

                    {/* Lista de Histórico */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                        <p className="text-xs font-semibold text-slate-500 mb-2 px-2 uppercase tracking-wider">Histórico</p>
                        {history.length === 0 && (
                            <p className="text-xs text-slate-600 px-2 italic">Nenhuma conversa salva.</p>
                        )}
                        {history.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => handleSelectSession(session.id)}
                                className={`text-sm p-2 rounded cursor-pointer flex items-center justify-between group transition-colors ${currentSessionId === session.id ? 'bg-blue-600/20 text-blue-200' : 'text-slate-400 hover:bg-slate-900'}`}
                            >
                                <div className="flex items-center gap-2 truncate max-w-[180px]">
                                    <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{session.title || 'Nova Conversa'}</span>
                                </div>
                                <button
                                    onClick={(e) => handleDeleteSession(e, session.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === ÁREA PRINCIPAL (DIREITA) === */}
                <div className="flex-1 flex flex-col h-full relative bg-gradient-to-b from-slate-950 to-slate-900">
                    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 bg-slate-950/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-white leading-tight">Kira AI</h2>
                                <p className="text-xs text-blue-400 font-medium">Head de Projetos</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full" />
                                    <div className="relative w-20 h-20 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-2xl">
                                        <Bot className="w-10 h-10 text-blue-400" />
                                    </div>
                                </div>
                                <div className="space-y-2 max-w-md">
                                    <h3 className="text-2xl font-bold text-white">Olá, Gerente.</h3>
                                    <p className="text-slate-400">
                                        Sou a <span className="text-blue-400 font-bold">Kira</span>. Estou monitorando seu cronograma e riscos em tempo real.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                    {["Quais tarefas estão atrasadas?", "Analise o risco do projeto", "Resuma o status da semana", "O que preciso priorizar hoje?"].map((sug) => (
                                        <button
                                            key={sug}
                                            onClick={() => handleSuggestionClick(sug)}
                                            className="p-4 text-sm text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-xl transition-all group"
                                        >
                                            <span className="group-hover:text-blue-300 transition-colors">{sug}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-6">
                                {messages.map((m: any) => (
                                    <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-slate-700' : 'bg-blue-600/20'}`}>
                                            {m.role === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-blue-400" />}
                                        </div>
                                        <div className={`flex flex-col max-w-[85%] space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <span className="text-xs text-slate-500">{m.role === 'user' ? 'Você' : 'Kira'}</span>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'}`}>
                                                <ReactMarkdown components={{
                                                    strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                                                    ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="" {...props} />
                                                }}>
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} className="h-4" />
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-900 border-t border-slate-800 flex-shrink-0 z-20 relative">
                        <form onSubmit={handleSendMessage} className="relative max-w-3xl mx-auto">
                            <Input
                                value={localInput}
                                onChange={(e) => setLocalInput(e.target.value)}
                                placeholder="Digite sua mensagem para a Kira..."
                                className="bg-slate-900/50 border-slate-700 text-slate-100 pr-14 h-14 rounded-2xl focus-visible:ring-blue-600 shadow-xl pl-6 text-base z-20 relative"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!localInput?.trim()}
                                className="absolute right-2 top-2 h-10 w-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all z-30 size-10 disabled:opacity-50"
                            >
                                {isLoading ? <span className="animate-spin text-lg">⏳</span> : <Send className="w-5 h-5" />}
                            </Button>
                        </form>
                        <p className="text-center text-xs text-slate-600 mt-3">
                            A Kira pode cometer erros. Verifique informações críticas no Dashboard.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
