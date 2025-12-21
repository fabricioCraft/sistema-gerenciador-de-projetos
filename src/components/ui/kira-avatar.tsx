import React from 'react';
import { cn } from "@/lib/utils";
import { KiraLogo } from './kira-logo';
import Image from 'next/image';

interface KiraAvatarProps {
    className?: string; // Additional Tailwind classes
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Size presets
    state?: 'idle' | 'processing' | 'thinking' | 'speaking'; // Animation states
    useImage?: boolean; // (Optional) Toggle to use an image core instead of SVG
}

export const KiraAvatar: React.FC<KiraAvatarProps> = ({
    className,
    size = 'md',
    state = 'idle',
    useImage = false
}) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-24 h-24",
        xl: "w-32 h-32",
        "2xl": "w-48 h-48"
    };

    return (
        <div className={cn(
            "relative flex items-center justify-center rounded-full bg-black border border-indigo-500/30 shadow-[0_0_30px_-5px_rgba(79,70,229,0.3)]",
            sizeClasses[size],
            className
        )}>
            {/* Background Glow - Always present for atmosphere */}
            <div className={cn("absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-20",
                state === 'thinking' && "animate-pulse duration-[3s]"
            )} />

            {/* Content Switch: Image vs SVG Logo */}
            {useImage ? (
                // 3. O Núcleo (A Imagem da Kira)
                // 3. O Núcleo (A Imagem da Kira)
                <div className="relative w-full h-full rounded-full flex items-center justify-center z-10 bg-black overflow-hidden">
                    {/* A Imagem com Máscara Radial Suave */}
                    {/* A classe 'mask-radial-faded' cria um fade out nas bordas */}
                    <div className="relative w-full h-full mix-blend-screen [mask-image:radial-gradient(circle,white_50%,transparent_95%)]">
                        <Image
                            src="/kira-core.png"
                            alt="Kira Core"
                            fill
                            className={cn(
                                "object-cover",
                                state === "speaking" ? "scale-110 duration-150" : "scale-100 duration-700"
                            )}
                        />
                    </div>

                    {/* Overlay extra para garantir que bordas sumam */}
                    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/50" />
                </div>
            ) : (
                // Default SVG Mode
                <KiraLogo iconOnly className="w-[70%] h-[70%]" />
            )}
        </div>
    );
};
