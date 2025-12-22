'use client';

import { KiraLogo } from '@/components/ui/kira-logo';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/components/home/CreateProjectDialog';
import { Plus } from 'lucide-react';

export function DashboardEmptyState() {
    return (
        <div className="relative min-h-[80vh] w-full flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-slate-800 bg-[#020203]">

            {/* Background: Grid sutil + Glow central */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

            {/* Conteúdo Central */}
            <div className="relative z-10 flex flex-col items-center max-w-2xl text-center px-4">

                {/* Logo Kira (Substituindo Avatar) */}
                <div className="mb-10 relative group flex justify-center">
                    {/* Glow traseiro para dar destaque */}
                    <div className="absolute -inset-8 bg-indigo-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-700" />

                    {/* Logo Grande e Imponente */}
                    <KiraLogo showIcon={true} className="h-20 w-auto text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>

                {/* Título e Subtítulo (Visíveis e Elegantes) */}
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                    O palco é seu, <span className="text-indigo-400">Gerente.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-lg mx-auto">
                    A Kira está pronta para estruturar seu próximo grande projeto. Escolha um ponto de partida ou comece do zero.
                </p>

                {/* Grid de Templates (Quick Start) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
                    <TemplateCard icon="🚀" title="Novo Produto" desc="MVP, Roadmap" />
                    <TemplateCard icon="📢" title="Marketing" desc="Campanha, Ads" />
                    <TemplateCard icon="💻" title="Software" desc="Sprints, Deploy" />
                </div>

                {/* Botão Principal */}
                <CreateProjectDialog trigger={
                    <Button size="lg" className="h-14 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-bold shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)] transition-all hover:scale-105 active:scale-95">
                        <Plus className="mr-2 h-5 w-5 text-black" />
                        Criar Projeto do Zero
                    </Button>
                } />

            </div>
        </div>
    );
}

// Sub-componente para os Cards de Template
function TemplateCard({ icon, title, desc }: any) {
    return (
        <CreateProjectDialog trigger={
            <button className="flex flex-col items-start p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:border-indigo-500/50 transition-all group text-left w-full cursor-pointer">
                <span className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">{icon}</span>
                <span className="text-sm font-semibold text-white mb-1">{title}</span>
                <span className="text-xs text-slate-500 group-hover:text-slate-400">{desc}</span>
            </button>
        } />
    );
}
