import React from 'react';
import { KiraAvatar } from '@/components/ui/kira-avatar';
import { KiraLogo } from "@/components/ui/kira-logo";
import { Quote } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-[#020203] text-white overflow-hidden font-sans selection:bg-indigo-500/30">

            {/* Lado Esquerdo: Formulário (Deve renderizar o children) */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 relative z-20 bg-black/50 backdrop-blur-sm lg:bg-transparent border-r border-white/5">

                {/* Branding Header */}
                <div className="absolute top-8 left-8 sm:left-12 lg:left-20 xl:left-28 z-20 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <KiraLogo className="h-8 w-auto text-slate-100" showIcon={false} />
                </div>

                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>

            {/* Lado Direito: Hero Kira */}
            <div className="hidden lg:flex flex-1 relative bg-[#020203] items-center justify-center overflow-hidden border-l border-white/5">

                {/* 1. Background Atmosférico (Profundidade) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black pointer-events-none" />
                <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-[0.15] mix-blend-overlay" />

                {/* 2. Composição da Marca (Centralizada) */}
                <div className="relative z-20 flex flex-col items-center">

                    {/* O ORBE (Fonte de Energia) */}
                    <div className="relative mb-10 group">
                        {/* Glow traseiro intenso */}
                        <div className="absolute -inset-10 bg-indigo-500/30 blur-[80px] rounded-full opacity-50 group-hover:opacity-75 transition-opacity duration-1000" />

                        {/* Componente Avatar (Tamanho aumentado para impacto) */}
                        <div className="transform transition-transform duration-700 hover:scale-105">
                            <KiraAvatar size="2xl" state="thinking" />
                        </div>
                    </div>

                    {/* O LOGOTIPO (Base Sólida) */}
                    <div className="relative mb-12 flex flex-col items-center">
                        {/* O Logo KIRA (Texto apenas) */}
                        <KiraLogo className="h-16 w-auto text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" showIcon={false} />

                        {/* Reflexo de luz embaixo do logo (Chão de vidro) */}
                        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent blur-sm mt-4 opacity-50" />
                    </div>

                    {/* 3. Copywriting (Slogan) */}
                    <div className="text-center space-y-4 max-w-lg px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <h2 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                            Orquestração Inteligente.
                        </h2>
                        <p className="text-slate-400 text-lg font-light leading-relaxed">
                            "Deixe a Kira analisar riscos e prever atrasos enquanto você lidera o time."
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
