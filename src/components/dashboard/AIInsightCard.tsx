'use client';

import * as React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { generateDashboardInsight } from "@/actions/ai-actions";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = {
    projectId: string;
    initialInsight?: string;
    lastUpdated?: Date | string | null;
    stats: {
        total: number;
        todo: number;
        doing: number;
        done: number;
        overdue: number;
        critical_urgent: number;
        critical_safe: number;
    };
};



const normalizeDate = (dateInput: string | Date | null | undefined): Date => {
    if (!dateInput) return new Date();

    if (dateInput instanceof Date) return dateInput;

    // Se for string do banco e não tiver indicador de fuso (Z ou +), 
    // concatenamos 'Z' para forçar o JavaScript a entender como UTC.
    if (typeof dateInput === 'string') {
        if (!dateInput.endsWith('Z') && !dateInput.includes('+')) {
            return new Date(dateInput + 'Z');
        }
        return new Date(dateInput);
    }

    return new Date();
}

export function AIInsightCard({ projectId, initialInsight, lastUpdated, stats }: Props) {
    const [insight, setInsight] = React.useState<string>(initialInsight || "");
    const [updatedAt, setUpdatedAt] = React.useState<Date>(normalizeDate(lastUpdated));
    const [isLoading, setIsLoading] = React.useState(!initialInsight);
    const [displayedText, setDisplayedText] = React.useState(initialInsight || "");

    // Typewriter effect logic
    React.useEffect(() => {
        if (!insight) return;

        setDisplayedText("");

        let i = 0;
        const intervalId = setInterval(() => {
            setDisplayedText(insight.slice(0, i + 1));
            i++;
            if (i > insight.length) clearInterval(intervalId);
        }, 15); // Typing speed

        return () => clearInterval(intervalId);
    }, [insight]);

    // Initial Fetch (only if no cache)
    React.useEffect(() => {
        if (initialInsight) {
            return;
        }

        let mounted = true;
        const fetchInsight = async () => {
            try {
                // Not forcing refresh, allowing cache check on server too
                const result = await generateDashboardInsight(projectId, stats, false);
                if (mounted) {
                    if (result.success && result.insight) {
                        setInsight(result.insight);
                        setUpdatedAt(new Date());
                    } else {
                        setInsight("Não foi possível conectar à IA.");
                    }
                    setIsLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setInsight("Erro ao carregar insight.");
                    setIsLoading(false);
                }
            }
        };

        fetchInsight();
        return () => { mounted = false; };
    }, [stats, projectId, initialInsight]);

    // Manual Refresh
    const handleRefresh = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const result = await generateDashboardInsight(projectId, stats, true); // Force Refresh
            if (result.success && result.insight) {
                setInsight(result.insight);
                setUpdatedAt(new Date());
                toast.success("Análise atualizada com sucesso.");
            } else {
                toast.error("Falha ao atualizar análise.");
            }
        } catch (error) {
            toast.error("Erro na comunicação com IA.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900 to-[#020203] p-6 shadow-2xl h-full flex flex-col justify-between">
            {/* Ambient Glow */}
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between mb-5 shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                    </div>
                    <h3 className="text-sm font-semibold tracking-wide text-indigo-100">
                        Kira Insight
                    </h3>
                </div>

                {/* Botão Expansível */}
                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="group flex items-center justify-center gap-0 hover:gap-2 px-2 hover:px-3 py-2 
                             bg-slate-800 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/50 
                             rounded-full transition-all duration-300 ease-out active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw
                        className={`w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors ${isLoading ? 'animate-spin' : ''}`}
                    />

                    <span className="max-w-0 overflow-hidden group-hover:max-w-[120px] whitespace-nowrap text-xs font-medium text-indigo-100 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                        Atualizar análise
                    </span>
                </button>
            </div>

            {/* Texto do Insight */}
            <div className={`relative z-10 min-h-[60px] transition-all duration-500 flex-1 ${isLoading ? 'blur-sm opacity-50' : 'opacity-100'}`}>
                <p className="text-sm leading-7 text-slate-200 font-light tracking-wide">
                    {displayedText}
                    {!isLoading && displayedText.length < insight.length && (
                        <span className="animate-pulse text-indigo-400">|</span>
                    )}
                </p>
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-end border-t border-white/5 pt-3 relative z-10 shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                        Atualizado {formatDistanceToNow(updatedAt, { addSuffix: true, locale: ptBR })}
                    </span>
                </div>
            </div>
        </div>
    );
}
