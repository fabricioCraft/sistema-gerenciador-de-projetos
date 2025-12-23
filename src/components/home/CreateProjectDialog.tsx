'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';

interface CreateProjectDialogProps {
    children?: React.ReactNode;
    defaultPrompt?: string;
}

export function CreateProjectDialog({ children, defaultPrompt = "" }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState(defaultPrompt);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen) {
            setDescription(defaultPrompt);
        }
    };

    const handleGenerate = async () => {
        if (!description.trim()) return;

        setIsLoading(true);

        try {
            const result = await generateAndCreateProject(description);

            if (result?.success && result?.projectId) {
                toast.success("Projeto iniciado!");
                setOpen(false);
                router.push(`/dashboard/${result.projectId}`);
            } else {
                toast.error("Erro ao criar projeto.");
            }

        } catch (error: any) {
            console.error(error);
            toast.error("Erro interno.");
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[600px] bg-[#0A0A0B] border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle>Novo Projeto com a Kira</DialogTitle>
                    <DialogDescription>
                        Descreva seu objetivo.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: App de delivery..."
                        className="min-h-[150px] bg-slate-900 border-slate-700 text-white"
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleGenerate} disabled={isLoading || !description.trim()}>
                        {isLoading ? "Criando..." : "Criar Projeto"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
