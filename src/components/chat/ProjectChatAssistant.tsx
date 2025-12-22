'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { createChatSession, getChatSessions, deleteChatSession, updateChatSessionTitle, getChatMessages } from '@/actions/chat-actions';
import { Bot, Send, Plus, MessageSquare, User, Sparkles, Trash2, Edit2, Check, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { KiraLogo } from '@/components/ui/kira-logo';
import { UserAvatar } from '@/components/UserAvatar';

export function ProjectChatAssistant({ projectId }: { projectId: string }) {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const sessionIdRef = useRef<string | null>(null); // Ref sync for immediate access
    const [isGenerating, setIsGenerating] = useState(false);


    // Hook do Vercel AI SDK
    const chatHelpers = useChat({
        streamProtocol: 'text',
        onResponse: (response: Response) => {
            const serverSessionId = response.headers.get('X-Chat-Session-Id');
            if (serverSessionId && serverSessionId !== currentSessionId) {
                setCurrentSessionId(serverSessionId);
                // Refresh history list in sidebar
                setTimeout(() => fetchHistory(), 1000);
            }
        },
        onFinish: () => {
            console.log("✅ Stream visual concluído.");
        },
        onError: (err: any) => {
            console.error("Chat Error:", err);
        }
    } as any) as any;

    const { messages, setMessages, append, sendMessage, isLoading } = chatHelpers;

    // debug logs
    useEffect(() => {
        console.log("🔄 STATE UPDATE: Messages mudou:", messages);
    }, [messages]);

    useEffect(() => {
        console.log("⏳ STATUS: isLoading:", isLoading);
    }, [isLoading]);

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

    // REMOVED: ensureSession manual creation. We let the backend create it on first message.

    // Helper para garantir sessão
    const ensureSession = async (): Promise<string | null> => {
        let activeId = currentSessionId;
        if (!activeId) {
            console.log("⚠️ Sessão nula. Criando nova...");
            const newSession = await createChatSession(projectId);
            if (newSession.success && newSession.session) {
                activeId = newSession.session.id;
                setCurrentSessionId(activeId);
                sessionIdRef.current = activeId;
                fetchHistory();
            }
        }
        return activeId;
    }

    // Envio de Mensagem Síncrono
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!localInput?.trim() || isGenerating) return;

        const userText = localInput;
        setLocalInput(''); // Limpa input
        setIsGenerating(true); // Ativa loader UI

        // 1. Otimistic Update (Mostra msg do usuário na hora)
        // Precisamos converter para o formato que o UI espera (pode ser Message do Vercel SDK)
        const tempUserMsg = {
            id: Date.now().toString(),
            role: 'user',
            content: userText
        };

        // setMessages vem do useChat, aceita array.
        setMessages((prev: any[]) => [...prev, tempUserMsg] as any);

        try {
            const activeId = await ensureSession();

            if (!activeId) {
                throw new Error("Falha ao criar sessão");
            }

            // 2. Chama API
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [...messages, tempUserMsg],
                    sessionId: activeId,
                    projectId
                })
            });

            if (!response.ok) throw new Error('Erro na API');

            const aiMsg = await response.json();

            // 3. Atualiza com a resposta da Kira
            setMessages((prev: any[]) => [...prev, aiMsg] as any);

        } catch (error) {
            console.error("Chat Error:", error);
            // Opcional: Mostrar toast de erro
        } finally {
            setIsGenerating(false); // Desativa loader
            fetchHistory(); // Atualiza título se tiver sido gerado
        }
    };

    // Clique na Sugestão
    const handleSuggestionClick = async (text: string) => {
        if (isGenerating) return;
        setLocalInput(text);
        // Pequeno timeout para permitir que o estado atualize antes de enviar, 
        // ou chamamos uma função de processamento direto que aceita texto.
        // Vamos refatorar handleSendMessage para aceitar texto opcional? 
        // Melhor não complicar o handleSendMessage do form. Vamos fazer inline aqui.

        setIsGenerating(true);
        const tempUserMsg = { id: Date.now().toString(), role: 'user', content: text };
        setMessages((prev: any[]) => [...prev, tempUserMsg] as any);

        try {
            const activeId = await ensureSession();
            if (!activeId) throw new Error("Falha ao criar sessão");

            const response = await fetch('/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [...messages, tempUserMsg],
                    sessionId: activeId,
                    projectId
                })
            });
            if (!response.ok) throw new Error('Erro na API');
            const aiMsg = await response.json();
            setMessages((prev: any[]) => [...prev, aiMsg] as any);
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
            setLocalInput(''); // Limpa caso tenha ficado texto
            fetchHistory(); // Atualiza título se tiver sido gerado
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
                    sessionIdRef.current = null;
                    setMessages([]);
                }
            }
        }
    };

    const handleSelectSession = async (id: string) => {
        setCurrentSessionId(id);
        sessionIdRef.current = id;
        // Load messages
        const res = await getChatMessages(id);
        if (res.success && res.data) {
            setMessages(res.data.map((m: any) => ({
                id: m.id,
                role: m.role as any,
                content: m.content
            })));
        }
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
                            onClick={() => {
                                setCurrentSessionId(null);
                                sessionIdRef.current = null;
                                setMessages([]);
                            }}
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
                                <div className="flex items-center gap-2 truncate flex-1">
                                    <MessageSquare className="w-3 h-3 flex-shrink-0" />

                                    {editingSessionId === session.id ? (
                                        <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="w-full bg-slate-950 border border-blue-500 rounded px-1 active:outline-none focus:outline-none text-xs h-6"
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter') {
                                                        e.stopPropagation();
                                                        await updateChatSessionTitle(session.id, editingTitle);
                                                        setEditingSessionId(null);
                                                        fetchHistory();
                                                    }
                                                }}
                                            />
                                            <button onClick={async (e) => {
                                                e.stopPropagation();
                                                await updateChatSessionTitle(session.id, editingTitle);
                                                setEditingSessionId(null);
                                                fetchHistory();
                                            }} className="text-green-400 hover:text-green-300">
                                                <Check className="w-3 h-3" />
                                            </button>
                                            <button onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingSessionId(null);
                                            }} className="text-slate-500 hover:text-slate-300">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="truncate flex-1">{session.title || 'Nova Conversa'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                    {!editingSessionId && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingSessionId(session.id);
                                                    setEditingTitle(session.title || '');
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-blue-400 transition-opacity"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteSession(e, session.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* === ÁREA PRINCIPAL (DIREITA) === */}
                <div className="flex-1 flex flex-col h-full relative bg-gradient-to-b from-slate-950 to-slate-900">
                    <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 bg-slate-950/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-900/50 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(79,70,229,0.2)]">
                                <KiraLogo iconOnly className="w-8 h-8" />
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
                                    <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full" />
                                    <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
                                        <KiraLogo iconOnly className="w-16 h-16" />
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
                                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${m.role === 'user' ? '' : 'bg-transparent'}`}>
                                            {m.role === 'user' ? (
                                                <UserAvatar name="Você" className="w-8 h-8" />
                                            ) : (
                                                <div className="relative w-9 h-9 flex items-center justify-center rounded-full bg-slate-900/50 border border-indigo-500/20 shadow-[0_0_10px_-2px_rgba(79,70,229,0.3)]">
                                                    <KiraLogo iconOnly className="w-7 h-7" />
                                                </div>
                                            )}
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
                                {isGenerating && (
                                    <div className="flex gap-4 items-center mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        {/* Avatar com Efeito de Processamento (Radar/Ping) */}
                                        <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
                                            {/* Loading Pulse Effect around Kira */}
                                            <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20 duration-1000"></div>
                                            <div className="relative w-9 h-9 rounded-full bg-slate-900 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]">
                                                <KiraLogo iconOnly className="w-12 h-12" /> {/* Increased size slightly for visual balance in loading state */}
                                            </div>
                                        </div>

                                        {/* Caixa de Texto 'Glass' com Gradiente */}
                                        <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-900/40 border border-slate-800/60 backdrop-blur-sm flex items-center gap-3">
                                            <span className="text-sm font-medium bg-gradient-to-r from-blue-200 via-indigo-200 to-slate-400 bg-clip-text text-transparent animate-pulse">
                                                Kira está analisando o contexto...
                                            </span>

                                            {/* Micro-loader sutil */}
                                            <div className="flex gap-1 h-2 items-center">
                                                <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                {isGenerating ? <span className="animate-spin text-lg">⏳</span> : <Send className="w-5 h-5" />}
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
