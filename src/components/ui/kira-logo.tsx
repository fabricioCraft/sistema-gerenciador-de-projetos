'use client';

export function KiraLogo({ className, showIcon = true, iconOnly = false }: { className?: string; showIcon?: boolean; iconOnly?: boolean }) {
    // Se iconOnly for true, forçamos showIcon para true (pois é o único elemento)
    const displayIcon = showIcon || iconOnly;

    return (
        <div className={`flex items-center gap-3 ${className}`}>

            {/* SVG Principal */}
            <svg
                viewBox={iconOnly ? "0 0 40 40" : "0 0 160 40"}
                className={iconOnly ? "h-full w-full text-slate-50 dark:text-slate-200" : "h-9 w-auto text-slate-50 dark:text-slate-200"}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="KIRA"
            >
                <defs>
                    {/* Gradientes Neon baseados na referência */}
                    <linearGradient id="neon-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f7ff" />
                        <stop offset="100%" stopColor="#00bcd4" />
                    </linearGradient>
                    <linearGradient id="neon-purple" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#bc13fe" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>

                    {/* Orb Glow Filter */}
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ícone NEON ORB (Animado) */}
                {displayIcon && (
                    // Se iconOnly, centralizamos em 20,20 (já que o viewbox é 40x40). 
                    // Se texto junto, movemos para 20,20 tb (layout original).
                    <g transform={iconOnly ? "translate(20, 20)" : "translate(20, 20)"}>
                        {/* Aura de Fundo */}
                        <circle cx="0" cy="0" r="14" fill="url(#neon-cyan)" opacity="0.05" />

                        {/* Anel Externo (Cyan) - Girando Lento */}
                        <g className="animate-[spin_8s_linear_infinite]">
                            <circle cx="0" cy="0" r="12" stroke="url(#neon-cyan)" strokeWidth="1.5" strokeDasharray="40 20" strokeLinecap="round" opacity="0.8" filter="url(#neon-glow)" />
                        </g>

                        {/* Anel Médio (Roxo) - Girando Rápido */}
                        <g className="animate-[spin_4s_linear_infinite_reverse]">
                            <circle cx="0" cy="0" r="8" stroke="url(#neon-purple)" strokeWidth="1.5" strokeDasharray="25 10" strokeLinecap="round" opacity="0.9" filter="url(#neon-glow)" />
                        </g>

                        {/* Núcleo (Estrela/Tech) */}
                        <circle cx="0" cy="0" r="3" fill="#fff" filter="url(#neon-glow)" className="animate-pulse" />
                        <circle cx="0" cy="0" r="15" stroke="url(#neon-purple)" strokeWidth="0.5" opacity="0.2" className="animate-pulse" />
                    </g>
                )}

                {/* Grupo de Texto - KIRA (Oculto se iconOnly) */}
                {!iconOnly && (
                    <g transform={displayIcon ? "translate(45, 0)" : "translate(5, 0)"}>
                        {/* Letra K */}
                        <path d="M10 8 V32 M25 8 L10 20 L25 32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />

                        {/* Letra I */}
                        <line x1="38" y1="14" x2="38" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                        {/* O Pingo (Dot) agora é Cyan Neon para combinar */}
                        <circle cx="38" cy="9" r="2.5" fill="url(#neon-cyan)" filter="url(#neon-glow)" />

                        {/* Letra R */}
                        <path d="M52 32 V8 H62 C68 8 68 20 62 20 H52 M62 20 L72 32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />

                        {/* Letra A */}
                        <path d="M85 32 L97 8 L109 32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                        <circle cx="97" cy="24" r="1.5" fill="currentColor" opacity="0.5" stroke="none" />
                    </g>
                )}

            </svg>
        </div>
    );
}
