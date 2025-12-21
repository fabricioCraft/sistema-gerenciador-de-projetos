import React from 'react';
import { cn } from "@/lib/utils";

interface KiraLogoProps {
    className?: string;
    iconOnly?: boolean;
}

export const KiraLogo: React.FC<KiraLogoProps> = ({ className, iconOnly = false, showIcon = true }) => {
    // Define animations separately to ensure correct SVG transform origins
    const styles = (
        <style dangerouslySetInnerHTML={{
            __html: `
      .kira-ring-outer {
        transform-origin: 20px 20px;
        animation: kira-spin 12s linear infinite;
      }
      .kira-ring-inner {
        transform-origin: 20px 20px;
        animation: kira-spin 3s linear infinite reverse;
      }
      .kira-core-breathe {
        transform-origin: 20px 20px;
        animation: kira-breathe 4s ease-in-out infinite;
      }
      @keyframes kira-spin { 
        from { transform: rotate(0deg); } 
        to { transform: rotate(360deg); } 
      }
      @keyframes kira-breathe { 
        0%, 100% { transform: scale(1); opacity: 0.9; filter: drop-shadow(0 0 2px rgba(96, 165, 250, 0.5)); } 
        50% { transform: scale(1.15); opacity: 1; filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.8)); } 
      }
    `}} />
    );

    const OrbGroup = (
        <g className="kira-orb-group">
            {/* 1. Aura de Fundo (Glow Estático) */}
            <circle cx="20" cy="20" r="16" fill="url(#orb-gradient)" filter="blur(8px)" opacity="0.3" />

            {/* 2. Anel Externo (Interface de Dados - Lento) */}
            {/* Gira devagar, linhas tracejadas finas */}
            <circle
                cx="20" cy="20" r="14"
                fill="none"
                stroke="url(#orb-gradient)"
                strokeWidth="0.5"
                strokeDasharray="2 4"
                className="kira-ring-outer"
                opacity="0.8"
            />

            {/* 3. Arco de Processamento (Segmento Sólido - Acompanha o anel externo) */}
            <path
                d="M 20 6 A 14 14 0 0 1 34 20"
                fill="none"
                stroke="url(#cyan-solid)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="kira-ring-outer"
            />

            {/* 4. Anel Interno (Reativo - Rápido Inverso) */}
            <circle
                cx="20" cy="20" r="9"
                fill="none"
                stroke="white"
                strokeWidth="0.8"
                strokeDasharray="10 10"
                className="kira-ring-inner"
                opacity="0.6"
            />

            {/* 5. O Núcleo (A Consciência - Respirando) */}
            <circle cx="20" cy="20" r="5" fill="#fff" className="kira-core-breathe" />

            {/* Ponto de Brilho no Núcleo (Reflexo de Lente) */}
            <circle cx="18" cy="18" r="1.5" fill="white" opacity="0.9" />
        </g>
    );

    const Defs = (
        <defs>
            <linearGradient id="orb-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" /> {/* Azul Claro */}
                <stop offset="100%" stopColor="#A855F7" /> {/* Roxo */}
            </linearGradient>
            <linearGradient id="cyan-solid" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan 400 */}
                <stop offset="100%" stopColor="#0ea5e9" /> {/* Sky 500 */}
            </linearGradient>
            <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    );

    if (iconOnly) {
        return (
            <svg
                viewBox="0 0 40 40"
                className={cn("h-10 w-10 text-slate-50", className)}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {styles}
                {Defs}
                {OrbGroup}
            </svg>
        );
    }

    return (
        <svg
            viewBox={showIcon ? "0 0 180 40" : "0 0 130 40"}
            className={cn("h-8 w-auto text-slate-50", className)}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {styles}
            {Defs}

            {/* Orb Section */}
            {showIcon && OrbGroup}

            {/* Text Section - Centered based on mode */}
            <g transform={showIcon ? "translate(5, 0)" : "translate(-32, 0)"}>
                {/* Letra K */}
                <path d="M45 8 V32 M62 8 L45 20 L62 32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />

                {/* Letra I */}
                <line x1="75" y1="14" x2="75" y2="32" stroke="currentColor" strokeWidth="2" />
                <circle cx="75" cy="9" r="2.5" fill="url(#orb-gradient)" filter="url(#glow-soft)" />

                {/* Letra R */}
                <path d="M90 32 V8 H102 C108 8 108 20 102 20 H90 M102 20 L112 32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />

                {/* Letra A (NASA Style) */}
                <path d="M125 32 L137 8 L149 32" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
                <circle cx="137" cy="24" r="1.5" fill="currentColor" opacity="0.5" />
            </g>

        </svg>
    );
};
