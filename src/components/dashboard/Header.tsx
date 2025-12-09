import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

export function DashboardHeader({ projectName }: { projectName: string }) {
    return (
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-gray-100/40 px-6 dark:bg-gray-800/40 justify-between">
            <div className="w-full flex-1">
                <h1 className="font-semibold text-lg">{projectName}</h1>
            </div>
            <div className="flex items-center gap-4">
                {/* O trigger do chat está na sidebar fixa, mas podemos manter este botão se quisermos redundância ou removê-lo.
                    Por enquanto, vou mantê-lo invisível ou removê-lo já que temos o botão flutuante.
                    Se for para manter: "Abrir Chat"
                */}
            </div>
        </header>
    );
}
