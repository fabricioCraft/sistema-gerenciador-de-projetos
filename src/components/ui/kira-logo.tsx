'use client';

import { cn } from "@/lib/utils";

export function KiraLogo({ className, showIcon = true, iconOnly = false }: { className?: string; showIcon?: boolean; iconOnly?: boolean }) {
    if (iconOnly) {
        return (
            <div className={cn("flex items-center select-none", className)}>
                <svg
                    viewBox="0 0 40 40"
                    className="h-full w-auto"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="kira-gradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                    </defs>
                    <g transform="translate(20, 20)">
                        <circle cx="0" cy="0" r="14" stroke="url(#kira-gradient)" strokeWidth="0.5" opacity="0.5" />
                        <path d="M -10 10 A 14 14 0 0 0 10 10" stroke="url(#kira-gradient)" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                        <circle cx="0" cy="0" r="5" fill="white" />
                    </g>
                </svg>
            </div>
        )
    }

    return (
        <div className={cn("flex items-center gap-3 select-none", className)}>

            <svg
                viewBox="0 0 160 40"
                className="h-full w-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    {/* Gradiente do Ponto e do Ícone */}
                    <linearGradient id="kira-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#60A5FA" /> {/* Blue-400 */}
                        <stop offset="100%" stopColor="#A855F7" /> {/* Purple-500 */}
                    </linearGradient>

                    {/* Glow Suave apenas para o ponto */}
                    <filter id="point-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ícone Orbe (Opcional) */}
                {showIcon && (
                    <g>
                        {/* 1. Anel Externo (Dados) - Gira devagar */}
                        <circle
                            cx="18" cy="20" r="14"
                            stroke="url(#kira-gradient)"
                            strokeWidth="0.5"
                            strokeDasharray="2 4" // Tracejado tecnológico
                            className="animate-orb-slow opacity-60"
                        />

                        {/* 2. Arco Interno (Processamento) - Gira ao contrário */}
                        <path
                            d="M 8 20 A 10 10 0 0 1 28 20" // Um semi-círculo
                            stroke="url(#kira-gradient)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            fill="none"
                            className="animate-orb-fast opacity-80"
                        />

                        {/* 3. Núcleo (A Consciência) - Pulsa */}
                        <circle
                            cx="18" cy="20" r="5"
                            fill="white"
                            className="animate-core"
                        />

                        {/* 4. Glow Estático (Para dar profundidade) */}
                        <circle cx="18" cy="20" r="10" fill="url(#kira-gradient)" filter="blur(12px)" opacity="0.3" />
                    </g>
                )}

                {/* TIPOGRAFIA (Sólida, Branca, Sem Animação de Borda) */}
                <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                    {/* K: Deslocado para dar espaço ao ícone se necessário */}
                    <path d="M50 8 V32 M67 8 L50 20 L67 32" transform={showIcon ? "translate(0,0)" : "translate(-35,0)"} />

                    {/* I: Haste Sólida */}
                    <line x1="80" y1="14" x2="80" y2="32" transform={showIcon ? "translate(0,0)" : "translate(-35,0)"} />

                    {/* R */}
                    <path d="M95 32 V8 H107 C113 8 113 20 107 20 H95 M107 20 L117 32" transform={showIcon ? "translate(0,0)" : "translate(-35,0)"} />

                    {/* A */}
                    <path d="M130 32 L142 8 L154 32" transform={showIcon ? "translate(0,0)" : "translate(-35,0)"} />
                </g>

                {/* O Pingo do I (O único elemento colorido/vivo nas letras) */}
                {/* Adicionei animate-pulse lento para dar vida sem sujeira */}
                <circle
                    cx="80" cy="8" r="3"
                    fill="url(#kira-gradient)"
                    filter="url(#point-glow)"
                    transform={showIcon ? "translate(0,0)" : "translate(-35,0)"}
                    className="animate-pulse"
                    style={{ animationDuration: '3s' }}
                />

                {/* Ponto do A (Detalhe Sci-Fi) */}
                <circle cx="142" cy="24" r="1.5" fill="currentColor" opacity="0.5" transform={showIcon ? "translate(0,0)" : "translate(-35,0)"} />

            </svg>
        </div>
    );
}
