'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateProjectSchedule } from '@/actions/scheduler';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SyncScheduleButtonProps {
    projectId: string;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function SyncScheduleButton({
    projectId,
    variant = 'outline',
    size = 'default'
}: SyncScheduleButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSync = async () => {
        setIsLoading(true);

        // Mostra toast de loading enquanto recalcula
        const loadingToastId = toast.loading('Recalculando cronograma...', {
            description: 'Aguarde enquanto as datas são atualizadas.'
        });

        try {
            const result = await calculateProjectSchedule(projectId);

            // Fecha o toast de loading
            toast.dismiss(loadingToastId);

            if (result.success) {
                toast.success('Cronograma recalculado!', {
                    description: `${result.updatedCount || 0} tarefas atualizadas.`
                });
                router.refresh();
            } else {
                toast.error('Falha ao recalcular', {
                    description: result.error || 'Erro desconhecido.'
                });
            }
        } catch (error) {
            // Fecha o toast de loading em caso de erro
            toast.dismiss(loadingToastId);
            console.error('Sync Schedule Error:', error);
            toast.error('Erro ao sincronizar cronograma');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleSync}
            disabled={isLoading}
            className="gap-2"
        >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {size !== 'icon' && (isLoading ? 'Recalculando...' : 'Recalcular Cronograma')}
        </Button>
    );
}
