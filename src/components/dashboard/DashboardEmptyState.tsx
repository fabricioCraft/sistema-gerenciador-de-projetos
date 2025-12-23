'use client';

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiraLogo } from "@/components/ui/kira-logo";
import { ProjectKickoffModal } from "./ProjectKickoffModal";

const TEMPLATES = {
    PRODUCT: `Projeto de Lançamento de MVP.
Objetivo: Criar uma versão inicial de um produto [insira o nicho] para validar mercado.
Escopo:
- Desenvolvimento do Core Feature
- Landing Page de conversão
- Configuração de Analytics
- Testes com usuários Beta
Prazo desejado: 4 semanas.`,

    MARKETING: `Campanha de Marketing Digital Q1.
Objetivo: Aumentar leads qualificados em 30%.
Canais: LinkedIn Ads, Email Marketing e Content.
Entregáveis:
- 5 Criativos para Ads
- Sequência de 3 Emails
- 2 Blog posts técnicos
- Setup do CRM`,

    SOFTWARE: `Desenvolvimento de API RESTful Escalável.
Stack: Node.js, PostgreSQL, Redis.
Requisitos:
- Autenticação JWT segura
- Endpoints de CRUD para [insira entidade]
- Documentação Swagger
- Testes unitários (Coverage > 80%)
- Pipeline de CI/CD`
};

const templateCards = [
    { icon: "🚀", title: "Novo Produto", desc: "MVP, Roadmap", prompt: TEMPLATES.PRODUCT },
    { icon: "📢", title: "Marketing", desc: "Campanha, Ads", prompt: TEMPLATES.MARKETING },
    { icon: "💻", title: "Software", desc: "Sprints, Deploy", prompt: TEMPLATES.SOFTWARE }
];

export function DashboardEmptyState() {
    return (
        <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-[#020203]">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center max-w-2xl text-center px-4">

                {/* Logo Kira Grande */}
                <div className="mb-8 relative group flex justify-center">
                    <div className="absolute -inset-8 bg-indigo-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-700" />
                    <KiraLogo showIcon={true} className="h-20 w-auto text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>

                {/* Textos */}
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                    O palco é seu, <span className="text-indigo-400">Gerente.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
                    A Kira está pronta para estruturar seu próximo grande projeto. Escolha um ponto de partida ou comece do zero.
                </p>

                {/* Grid de Templates (Quick Start) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
                    {templateCards.map((template) => (
                        <ProjectKickoffModal key={template.title} defaultPrompt={template.prompt}>
                            <button className="flex flex-col items-start p-5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-indigo-500/50 transition-all duration-300 group text-left w-full h-full cursor-pointer">
                                <span className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 block">{template.icon}</span>
                                <span className="text-base font-semibold text-white mb-2 block">{template.title}</span>
                                <span className="text-xs text-slate-400 font-medium leading-relaxed block">{template.desc}</span>
                            </button>
                        </ProjectKickoffModal>
                    ))}
                </div>

                {/* Botão Principal */}
                <ProjectKickoffModal defaultPrompt="">
                    <Button
                        size="lg"
                        className="h-14 px-8 rounded-full bg-white text-black hover:bg-slate-200 font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        <Plus className="mr-2 h-5 w-5 text-black" />
                        Criar Projeto do Zero
                    </Button>
                </ProjectKickoffModal>

            </div>
        </div>
    );
}
