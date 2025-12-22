'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Sparkles, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateAndCreateProject } from '@/actions/ai-actions';

export function CreateProjectDialog({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!description.trim()) return;

        setIsLoading(true);
        try {
            const result = await generateAndCreateProject(description);
            if (result.success && result.projectId) {
                setOpen(false);
                router.push(`/dashboard/${result.projectId}`);
            } else {
                alert('Falha ao gerar projeto. Por favor, tente novamente.');
            }
        } catch (error) {
            console.error(error);
            alert('Ocorreu um erro.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        Novo Projeto <Plus className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        Kickoff de Projeto com IA
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Descreva sua ideia de projeto e nosso Agente PMP criará uma EAP detalhada, estimará tarefas e montará seu cronograma.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Ex: Quero criar um marketplace de NFTs na Solana com sistema de leilão..."
                        className="min-h-[150px] text-lg p-4 resize-none"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>Cancelar</Button>
                    <Button onClick={handleCreate} disabled={!description.trim() || isLoading} className="bg-purple-600 hover:bg-purple-700">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Consultando PMBOK...
                            </>
                        ) : (
                            'Gerar Plano'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
