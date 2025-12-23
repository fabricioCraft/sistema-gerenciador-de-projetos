'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { generateAndCreateProject } from '@/actions/ai-actions';
import { toast } from 'sonner';

interface ProjectKickoffModalProps {
    children: React.ReactNode; // O botão ou card que abre o modal
    defaultPrompt?: string;    // O texto que já vem escrito
}

export function ProjectKickoffModal({ children, defaultPrompt = "" }: ProjectKickoffModalProps) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState(defaultPrompt);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Garante que o texto atualize quando o modal abre ou o template muda
    useEffect(() => {
        if (open) setDescription(defaultPrompt);
    }, [open, defaultPrompt]);

    const handleCreate = async () => {
        if (!description.trim()) return;
        setIsLoading(true);
        try {
            const result = await generateAndCreateProject(description);
            if (result.success && result.projectId) {
                setOpen(false);
                toast.success("Projeto iniciado!");
                router.push(`/dashboard/${result.projectId}`);
            } else {
                toast.error("Erro ao criar projeto.", { description: result.error });
            }
        } catch (e) {
            console.error(e);
            toast.error("Erro interno.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] bg-[#0A0A0B] border-slate-800 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                        </div>
                        <DialogTitle className="text-xl">Novo Projeto</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Ajuste a descrição abaixo para a Kira criar o plano perfeito.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[200px] bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 resize-none text-base p-4 leading-relaxed"
                        placeholder={`Descreva seu projeto com o máximo de detalhes para um planejamento preciso.

Exemplo:
"Gostaria de desenvolver um Marketplace de Serviços para autônomos.
Principais funcionalidades: Cadastro de perfil, Busca com geolocalização, Chat em tempo real e Pagamento via Stripe.
Tecnologias: React Native e Node.js.
Objetivo: Lançar o MVP em 3 meses focando apenas no mobile."`}
                        autoFocus
                    />
                    <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span className="opacity-80">
                            Dica: Mencione a <strong>tecnologia</strong>, o <strong>prazo desejado</strong> e as <strong>funcionalidades críticas</strong> para a Kira gerar uma EAP perfeita.
                        </span>
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                        className="text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleCreate}
                        disabled={isLoading || !description.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[180px]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Consultando PMBOK...
                            </span>
                        ) : "Gerar Plano 🚀"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
