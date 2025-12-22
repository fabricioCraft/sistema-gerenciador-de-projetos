'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateTaskStatus } from '@/actions/tasks';
import { deleteTask, updateTask } from '@/actions/task-details';
import { updateTaskAndPropagate } from '@/actions';
import { CheckCircle2, Circle, Clock, MoreHorizontal, Pencil, Trash2, ArrowUp, Calendar as CalendarIcon, User, AlignLeft, Tag, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from '@/components/UserAvatar';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';

// Helper to format dates consistently, avoiding timezone shift issues
// Uses UTC components to ensure the date displayed matches what's stored in Supabase
const formatTaskDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '...';
    const date = new Date(dateInput);
    // Use UTC date components to avoid timezone shift (Supabase stores in UTC)
    // This ensures "2024-12-13T21:00:00Z" displays as "13 dez", not "14 dez"
    return format(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()), 'd MMM', { locale: ptBR });
};


type Task = {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    isCritical?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    duration?: number | null;
    priority?: string | null;
    assignedTo?: string | null;
};

// Mock team members for assignment
const TEAM_MEMBERS = [
    { id: '1', name: 'Ana Designer', initials: 'AD', color: 'bg-pink-500' },
    { id: '2', name: 'João Dev', initials: 'JD', color: 'bg-blue-500' },
    { id: '3', name: 'Maria PM', initials: 'MP', color: 'bg-green-500' },
    { id: '4', name: 'Carlos QA', initials: 'CQ', color: 'bg-purple-500' },
];

// Priority labels with colors
const PRIORITY_OPTIONS = [
    { id: 'urgent', label: 'Urgente', color: 'bg-red-500', textColor: 'text-red-600' },
    { id: 'high', label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { id: 'medium', label: 'Médio', color: 'bg-blue-500', textColor: 'text-blue-600' },
    { id: 'low', label: 'Baixo', color: 'bg-green-500', textColor: 'text-green-600' },
];

type TaskBoardProps = {
    tasks: Task[];
    projectId: string;
    highlightedTaskId?: string | null;
};

const COLUMNS = [
    { id: 'todo', label: 'A Fazer', icon: Circle, color: 'text-slate-500' },
    { id: 'in_progress', label: 'Em Progresso', icon: Clock, color: 'text-blue-500' },
    { id: 'done', label: 'Concluído', icon: CheckCircle2, color: 'text-green-500' },
];


export function TaskBoard({ tasks: initialTasks, projectId, highlightedTaskId }: TaskBoardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tasks, setTasks] = useState(initialTasks);
    const [openTaskId, setOpenTaskId] = useState<string | null>(null);

    // Sync state with props when server revalidates
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Auto-open highlighted task Sheet
    useEffect(() => {
        if (highlightedTaskId) {
            setOpenTaskId(highlightedTaskId);
            // Clean up URL after opening
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [highlightedTaskId]);

    // NOTE: Self-healing auto-scheduling removed for performance.
    // Use the "Recalcular Cronograma" button in the Gantt view if dates are missing.
    // const [activeTask, setActiveTask] = useState<Task | null>(null); // Sheet controls itself via trigger? Or we need controlled state to update it.

    // To allow sheet state to be updatable, we might need to rely on the fact that 'tasks' state is updating.
    // However, when we click a card, we want to open that specific card's sheet.
    // The Sheet component is being used inside the map loop, so each card has its own sheet. 
    // This is fine for now, though keeping one global sheet would be more performant for DOM.
    // Given the previous code used a per-card sheet, I will stick to that to minimize large refactors, 
    // but I will improve the content within it.

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t.id === draggableId ? { ...t, status: newStatus } : t
        );
        setTasks(updatedTasks);

        try {
            const response = await updateTaskStatus(draggableId, newStatus);
            if (!response.success) {
                throw new Error('Failed to update');
            }
            router.refresh();
        } catch (error) {
            setTasks(initialTasks);
            toast.error("Failed to move task");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        // Optimistic delete
        const previousTasks = [...tasks];
        setTasks(tasks.filter(t => t.id !== taskId));

        try {
            const res = await deleteTask(taskId);
            if (!res.success) throw new Error("Failed");
            toast.success("Tarefa removida");
            router.refresh();
        } catch (e) {
            setTasks(previousTasks);
            toast.error("Erro ao remover tarefa");
        }
    };

    const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
        // Optimistic Update in place might be tricky if inside a sheet, but we can try updating local state
        setTasks(tasks.map(t => t.id === taskId ? { ...t, ...data } : t));

        await updateTask(taskId, {
            title: data.title,
            description: data.description,
            // map dates back to strings/dates if needed by schema, but schema uses timestamp so Date is fine
            startDate: data.startDate,
            endDate: data.endDate,
        });
        router.refresh();
    };

    const getColumnTasks = (columnId: string) => {
        return tasks
            .filter(task => {
                const status = task.status || 'todo';
                return status === columnId;
            })
            .sort((a, b) => {
                // Se ambas têm data de início, ordena por data (mais recente primeiro? Não, mais antiga primeiro, cronológica)
                if (a.startDate && b.startDate) {
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                }
                // Se a tem data e b não, a vem primeiro
                if (a.startDate && !b.startDate) return -1;
                // Se b tem data e a não, b vem primeiro
                if (!a.startDate && b.startDate) return 1;
                // Se nenhuma tem data, mantém ordem original ou por nome
                return 0;
            });
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4">
                {COLUMNS.map(column => (
                    <div key={column.id} className="flex h-full w-[350px] min-w-[350px] flex-col rounded-xl bg-gray-100/50 dark:bg-gray-900/50 border border-transparent">

                        {/* Column Header */}
                        <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200 ml-2">{column.label}</h3>
                                <div className="text-xs text-muted-foreground font-medium w-5 h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full">
                                    {getColumnTasks(column.id).length}
                                </div>
                            </div>
                        </div>

                        {/* Column Content */}
                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`flex-1 px-2 pb-2 space-y-2 transition-colors overflow-y-auto min-h-[150px] ${snapshot.isDraggingOver ? 'bg-gray-200/50 dark:bg-gray-800/50 rounded-lg' : ''
                                        }`}
                                >
                                    {getColumnTasks(column.id).map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    style={{ ...provided.draggableProps.style }}
                                                    className="outline-none"
                                                >
                                                    <Sheet
                                                        open={openTaskId === task.id}
                                                        onOpenChange={(open) => setOpenTaskId(open ? task.id : null)}
                                                    >
                                                        <SheetTrigger asChild>
                                                            <div className={`
                                                                group relative cursor-pointer
                                                                bg-white dark:bg-gray-800 
                                                                rounded-lg shadow-sm hover:shadow-md border border-slate-200 dark:border-gray-700
                                                                hover:border-blue-400 dark:hover:border-blue-500
                                                                transition-all duration-200 p-3
                                                                ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-primary ring-opacity-20 z-50' : ''}
                                                                ${highlightedTaskId === task.id ? 'ring-2 ring-amber-400 dark:ring-amber-500 shadow-lg shadow-amber-100 dark:shadow-amber-900/20' : ''}
                                                            `}>
                                                                {/* Edit Icon Overlay */}
                                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-700 rounded bg-white/80 dark:bg-gray-800/80">
                                                                                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => { }}>
                                                                                <Pencil className="mr-2 h-3.5 w-3.5" /> Abrir Card
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuSeparator />
                                                                            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteTask(task.id);
                                                                            }}>
                                                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Deletar
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

                                                                {/* Title */}
                                                                <div className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 leading-snug break-words pr-6">
                                                                    {task.title}
                                                                </div>

                                                                {/* Tags Row */}
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-1">
                                                                    {task.duration != null && (
                                                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-100 dark:border-blue-800">
                                                                            <Clock className="w-3 h-3 mr-1" />
                                                                            {task.duration}h
                                                                        </Badge>
                                                                    )}

                                                                    {task.isCritical && (
                                                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold">
                                                                            Crítico
                                                                        </Badge>
                                                                    )}

                                                                    {/* Priority Badge - Visible on Card */}
                                                                    {task.priority && (
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`h-5 px-1.5 text-[10px] font-medium border ${task.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' :
                                                                                task.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
                                                                                    task.priority === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                                                                                        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                                                                }`}
                                                                        >
                                                                            {PRIORITY_OPTIONS.find(p => p.id === task.priority)?.label || task.priority}
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                {/* Meta Row */}
                                                                <div className="flex items-center justify-between mt-3">
                                                                    {(task.description) && (
                                                                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                                                                    )}

                                                                    {/* Spacer if no desc icon */}
                                                                    {(!task.description) && <div />}

                                                                    <div className="flex items-center gap-2 overflow-hidden justify-end w-full ml-2">
                                                                        {/* Improved Date Display */}
                                                                        <div className="flex items-center text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md transition-colors whitespace-nowrap">
                                                                            <CalendarIcon className="h-3 w-3 mr-1.5 shrink-0 text-slate-500" />
                                                                            {task.startDate && task.endDate ? (
                                                                                <span className="font-medium text-slate-600 dark:text-slate-300">
                                                                                    {formatTaskDate(task.startDate)} → {formatTaskDate(task.endDate)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-400 italic">Sem data</span>
                                                                            )}
                                                                        </div>

                                                                        {/* Avatar - Shows assigned member or default */}
                                                                        {task.assignedTo ? (
                                                                            <UserAvatar
                                                                                name={TEAM_MEMBERS.find(m => m.id === task.assignedTo)?.name}
                                                                                className="h-6 w-6 ring-2 ring-white dark:ring-gray-900 shrink-0"
                                                                            />
                                                                        ) : (
                                                                            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shrink-0">
                                                                                <User className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </SheetTrigger>

                                                        <SheetContent className="sm:max-w-2xl overflow-y-auto p-0 gap-0">
                                                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-b">
                                                                <SheetHeader className="space-y-0 p-0">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="mt-1">
                                                                            <CreditCardIcon />
                                                                        </div>
                                                                        <div className="w-full space-y-2">
                                                                            <SheetTitle>
                                                                                <Input
                                                                                    defaultValue={task.title}
                                                                                    className="text-xl font-bold border-transparent bg-transparent px-1 h-auto focus-visible:ring-0 focus-visible:bg-white dark:focus-visible:bg-gray-800 -ml-1.5 w-full shadow-none"
                                                                                    onBlur={(e) => handleUpdateTask(task.id, { title: e.target.value })}
                                                                                />
                                                                            </SheetTitle>
                                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                                <span>na lista</span>
                                                                                <Badge variant="outline" className="capitalize bg-transparent font-normal">
                                                                                    {COLUMNS.find(c => c.id === task.status)?.label}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </SheetHeader>
                                                            </div>

                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                                                                {/* Main Column (75%) */}
                                                                <div className="md:col-span-3 space-y-8">
                                                                    {/* Description */}
                                                                    <div>
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <AlignLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                                                            <h3 className="font-semibold text-base">Descrição</h3>
                                                                        </div>
                                                                        <div className="pl-8">
                                                                            <Textarea
                                                                                placeholder="Adicionar uma descrição mais detalhada..."
                                                                                defaultValue={task.description || ''}
                                                                                className="min-h-[120px] bg-slate-50 dark:bg-slate-900/50 resize-y border-transparent focus:bg-white dark:focus:bg-gray-950 focus:border-input transition-all"
                                                                                onBlur={(e) => handleUpdateTask(task.id, { description: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* Activity / Comments Placeholder */}
                                                                    <div>
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <AlignLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                                                            <h3 className="font-semibold text-base">Atividade</h3>
                                                                        </div>
                                                                        <div className="pl-8 flex gap-3">
                                                                            <UserAvatar className="h-8 w-8" name="User" />
                                                                            <div className="w-full border rounded-md p-2 bg-white dark:bg-gray-950 shadow-sm text-sm text-muted-foreground h-12 flex items-center px-4">
                                                                                Escrever um comentário...
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Sidebar Column (25%) */}
                                                                <div className="md:col-span-1 space-y-6">
                                                                    {/* Add To Card Section */}
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Adicionar ao cartão</h4>

                                                                        {/* Members Button with Popover */}
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                                    <Users className="h-3.5 w-3.5 mr-2" />
                                                                                    Membros
                                                                                    {task.assignedTo && (
                                                                                        <div className="ml-auto">
                                                                                            <UserAvatar
                                                                                                name={TEAM_MEMBERS.find(m => m.id === task.assignedTo)?.name}
                                                                                                className="w-5 h-5"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-64 p-0" align="start">
                                                                                <Command>
                                                                                    <CommandInput placeholder="Buscar membro..." />
                                                                                    <CommandList>
                                                                                        <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                                                                                        <CommandGroup heading="Equipe">
                                                                                            {TEAM_MEMBERS.map((member) => (
                                                                                                <CommandItem
                                                                                                    key={member.id}
                                                                                                    onSelect={async () => {
                                                                                                        await updateTask(task.id, { assignedTo: member.id } as any);
                                                                                                        toast.success(`Tarefa atribuída a ${member.name}`);
                                                                                                        router.refresh();
                                                                                                    }}
                                                                                                    className="cursor-pointer"
                                                                                                >
                                                                                                    <UserAvatar
                                                                                                        name={member.name}
                                                                                                        className="w-6 h-6 mr-2"
                                                                                                    />
                                                                                                    <span>{member.name}</span>
                                                                                                    {task.assignedTo === member.id && (
                                                                                                        <Check className="ml-auto h-4 w-4 text-green-500" />
                                                                                                    )}
                                                                                                </CommandItem>
                                                                                            ))}
                                                                                        </CommandGroup>
                                                                                    </CommandList>
                                                                                </Command>
                                                                            </PopoverContent>
                                                                        </Popover>

                                                                        {/* Priority/Labels Button with Popover */}
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                                    <Tag className="h-3.5 w-3.5 mr-2" />
                                                                                    Etiquetas
                                                                                    {task.priority && (
                                                                                        <span className={`ml-auto w-2 h-2 rounded-full ${PRIORITY_OPTIONS.find(p => p.id === task.priority)?.color || 'bg-gray-400'}`} />
                                                                                    )}
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-48 p-2" align="start">
                                                                                <div className="space-y-1">
                                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Prioridade</p>
                                                                                    {PRIORITY_OPTIONS.map((priority) => (
                                                                                        <button
                                                                                            key={priority.id}
                                                                                            onClick={async () => {
                                                                                                await updateTask(task.id, { priority: priority.id } as any);
                                                                                                toast.success(`Prioridade definida: ${priority.label}`);
                                                                                                router.refresh();
                                                                                            }}
                                                                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${task.priority === priority.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                                                                                        >
                                                                                            <span className={`w-3 h-3 rounded-full ${priority.color}`} />
                                                                                            <span className={priority.textColor}>{priority.label}</span>
                                                                                            {task.priority === priority.id && (
                                                                                                <Check className="ml-auto h-3.5 w-3.5 text-green-500" />
                                                                                            )}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>

                                                                        {/* Dates Button with Calendar Popover - Start and End Date */}
                                                                        <Popover>
                                                                            <PopoverTrigger asChild>
                                                                                <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                                    <CalendarIcon className="h-3.5 w-3.5 mr-2" />
                                                                                    Datas
                                                                                    {(task.startDate || task.endDate) && (
                                                                                        <span className="ml-auto text-xs text-muted-foreground">
                                                                                            {formatTaskDate(task.startDate)} - {formatTaskDate(task.endDate)}
                                                                                        </span>
                                                                                    )}
                                                                                </Button>
                                                                            </PopoverTrigger>
                                                                            <PopoverContent className="w-auto p-0" align="start">
                                                                                <div className="p-3 border-b">
                                                                                    <p className="text-sm font-semibold">Alterar Datas da Tarefa</p>
                                                                                    <p className="text-xs text-muted-foreground">Dependências serão recalculadas automaticamente</p>
                                                                                </div>
                                                                                <div className="p-4 space-y-4">
                                                                                    {/* Start Date */}
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-muted-foreground block mb-2">Data de Início</label>
                                                                                        <Calendar
                                                                                            mode="single"
                                                                                            selected={task.startDate ? new Date(task.startDate) : undefined}
                                                                                            onSelect={async (date) => {
                                                                                                if (date) {
                                                                                                    const loadingId = toast.loading("Calculando dependências...");
                                                                                                    const endDate = task.endDate ? new Date(task.endDate) : new Date(date.getTime() + (task.duration || 1) * 60 * 60 * 1000);
                                                                                                    // Ensure end date is not before start date
                                                                                                    const adjustedEndDate = endDate < date ? new Date(date.getTime() + 24 * 60 * 60 * 1000) : endDate;
                                                                                                    try {
                                                                                                        const result = await updateTaskAndPropagate(task.id, date, adjustedEndDate);
                                                                                                        if (result.success) {
                                                                                                            toast.dismiss(loadingId);
                                                                                                            toast.success('Data de início atualizada.', { description: 'Impactos calculados.' });
                                                                                                        } else {
                                                                                                            toast.dismiss(loadingId);
                                                                                                            toast.error('Erro ao atualizar data de início');
                                                                                                        }
                                                                                                        router.refresh();
                                                                                                    } catch (error) {
                                                                                                        toast.dismiss(loadingId);
                                                                                                        toast.error('Erro crítico ao atualizar cronograma');
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            locale={ptBR}
                                                                                            className="rounded-md border"
                                                                                        />
                                                                                    </div>

                                                                                    {/* End Date */}
                                                                                    <div>
                                                                                        <label className="text-xs font-medium text-muted-foreground block mb-2">Data de Término</label>
                                                                                        <Calendar
                                                                                            mode="single"
                                                                                            selected={task.endDate ? new Date(task.endDate) : undefined}
                                                                                            onSelect={async (date) => {
                                                                                                if (date) {
                                                                                                    const loadingId = toast.loading("Ajustando prazos...");
                                                                                                    const startDate = task.startDate ? new Date(task.startDate) : new Date();
                                                                                                    // Ensure start date is not after end date
                                                                                                    const adjustedStartDate = startDate > date ? new Date(date.getTime() - 24 * 60 * 60 * 1000) : startDate;
                                                                                                    try {
                                                                                                        const result = await updateTaskAndPropagate(task.id, adjustedStartDate, date);
                                                                                                        if (result.success) {
                                                                                                            toast.dismiss(loadingId);
                                                                                                            toast.success('Data de término atualizada.', { description: 'Cronograma realinhado.' });
                                                                                                        } else {
                                                                                                            toast.dismiss(loadingId);
                                                                                                            toast.error('Erro ao atualizar data de término');
                                                                                                        }
                                                                                                        router.refresh();
                                                                                                    } catch (error) {
                                                                                                        toast.dismiss(loadingId);
                                                                                                        toast.error('Erro crítico ao atualizar cronograma');
                                                                                                    }
                                                                                                }
                                                                                            }}
                                                                                            locale={ptBR}
                                                                                            className="rounded-md border"
                                                                                            disabled={(date) => task.startDate ? date < new Date(task.startDate) : false}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </PopoverContent>
                                                                        </Popover>
                                                                    </div>

                                                                    {/* Actions Section */}
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ações</h4>

                                                                        <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                            <ArrowUp className="h-3.5 w-3.5 mr-2" /> Mover
                                                                        </Button>
                                                                        <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
                                                                            onClick={() => handleDeleteTask(task.id)}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Arquivar
                                                                        </Button>
                                                                    </div>

                                                                    {/* Dates Display */}
                                                                    {(task.startDate || task.endDate) && (
                                                                        <div className="pt-4 border-t">
                                                                            <div className="text-xs text-muted-foreground mb-1">Datas</div>
                                                                            <div className="text-sm">
                                                                                {formatTaskDate(task.startDate)} - {formatTaskDate(task.endDate)}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </SheetContent>
                                                    </Sheet>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )
                            }
                        </Droppable >
                    </div >
                ))}
            </div >
        </DragDropContext >
    );
}

const CreditCardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-gray-700 dark:text-gray-300">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
)
