'use client';

import { useState, useEffect, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, X, UserPlus, Loader2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { inviteMember, removeMember, getProjectMembers } from '@/actions/team';
import { toast } from 'sonner';

interface TeamMember {
    id: string;
    email: string;
    role: string | null;
    status: string | null;
    invitedAt: Date | null;
    userId: string | null;
    userName: string | null;
    userAvatar: string | null;
}

interface TeamManagerDialogProps {
    projectId: string;
    trigger?: React.ReactNode;
}

export function TeamManagerDialog({ projectId, trigger }: TeamManagerDialogProps) {
    const [open, setOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);

    // Carrega membros quando abre o modal
    useEffect(() => {
        if (open) {
            loadMembers();
        }
    }, [open, projectId]);

    const loadMembers = async () => {
        setIsLoading(true);
        try {
            const result = await getProjectMembers(projectId);
            setMembers(result);
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!email.trim() || !email.includes('@')) {
            toast.error("Informe um e-mail válido.");
            return;
        }

        startTransition(async () => {
            const result = await inviteMember(projectId, email);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Convite enviado!");
                setEmail("");
                loadMembers();
            }
        });
    };

    const handleRemove = async (memberId: string) => {
        startTransition(async () => {
            await removeMember(memberId, projectId);
            toast.success("Membro removido.");
            loadMembers();
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="gap-2 rounded-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                        <Users className="w-4 h-4" />
                        Compartilhar
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px] bg-[#0A0A0B] border-slate-800 text-white">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        <DialogTitle className="text-xl">Gerenciar Equipe</DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-400">
                        Adicione colaboradores ao projeto por e-mail.
                    </DialogDescription>
                </DialogHeader>

                {/* Input de Convite */}
                <div className="flex gap-2 mt-4">
                    <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                    />
                    <Button
                        onClick={handleInvite}
                        disabled={isPending || !email.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4"
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Convidar
                            </>
                        )}
                    </Button>
                </div>

                {/* Lista de Membros */}
                <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhum colaborador ainda.</p>
                            <p className="text-xs opacity-75">Convide alguém para começar!</p>
                        </div>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <UserAvatar
                                        name={member.userName || member.email}
                                        avatarUrl={member.userAvatar}
                                        className="h-9 w-9"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {member.userName || member.email}
                                        </p>
                                        <p className="text-xs text-slate-500 flex items-center gap-2">
                                            {member.role === 'owner' ? 'Dono' : member.role === 'admin' ? 'Admin' : 'Membro'}
                                            {member.status === 'pending' && (
                                                <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                                    Pendente
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {member.role !== 'owner' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemove(member.id)}
                                        disabled={isPending}
                                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
