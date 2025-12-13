'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { updateTaskStatus } from '@/actions/tasks';
import { deleteTask, updateTask } from '@/actions/task-details';
import { CheckCircle2, Circle, Clock, MoreHorizontal, Pencil, Trash2, ArrowUp, Calendar, User, AlignLeft, Tag, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';


type Task = {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    isCritical?: boolean; // Propriedade injetada
    startDate?: Date | null;
    endDate?: Date | null;
    duration?: number | null;
    // ... outros campos se necessário
};

type TaskBoardProps = {
    tasks: Task[];
    projectId: string;
};

const COLUMNS = [
    { id: 'todo', label: 'A Fazer', icon: Circle, color: 'text-slate-500' },
    { id: 'in_progress', label: 'Em Progresso', icon: Clock, color: 'text-blue-500' },
    { id: 'done', label: 'Concluído', icon: CheckCircle2, color: 'text-green-500' },
];

import { useRouter } from 'next/navigation';

export function TaskBoard({ tasks: initialTasks, projectId }: TaskBoardProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState(initialTasks);
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
        return tasks.filter(task => {
            const status = task.status || 'todo';
            return status === columnId;
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
                                                    <Sheet>
                                                        <SheetTrigger asChild>
                                                            <div className={`
                                                                group relative cursor-pointer
                                                                bg-white dark:bg-gray-800 
                                                                rounded-lg shadow-sm hover:shadow-md border border-slate-200 dark:border-gray-700
                                                                hover:border-blue-400 dark:hover:border-blue-500
                                                                transition-all duration-200 p-3
                                                                ${snapshot.isDragging ? 'rotate-2 scale-105 shadow-xl ring-2 ring-primary ring-opacity-20 z-50' : ''}
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
                                                                <div className="flex flex-wrap items-center gap-2 mt-2 mb-1">
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
                                                                </div>

                                                                {/* Meta Row */}
                                                                <div className="flex items-center justify-between mt-3">
                                                                    {(task.description) && (
                                                                        <AlignLeft className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
                                                                    )}

                                                                    {/* Spacer if no desc icon */}
                                                                    {(!task.description) && <div />}

                                                                    <div className="flex items-center gap-2 overflow-hidden justify-end w-full ml-2">
                                                                        {(task.startDate || task.endDate) && (
                                                                            <div className="flex items-center text-[10px] text-muted-foreground bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                                                <Calendar className="h-3 w-3 mr-1 shrink-0" />
                                                                                {task.startDate ? format(new Date(task.startDate), 'd MMM', { locale: ptBR }) : '?'} - {task.endDate ? format(new Date(task.endDate), 'd MMM', { locale: ptBR }) : '?'}
                                                                            </div>
                                                                        )}
                                                                        <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 border border-transparent shrink-0">
                                                                            <User className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                                                        </div>
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
                                                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                                                <User className="h-4 w-4 text-indigo-600" />
                                                                            </div>
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

                                                                        <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                            <Users className="h-3.5 w-3.5 mr-2" /> Membros
                                                                        </Button>
                                                                        <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                            <Tag className="h-3.5 w-3.5 mr-2" /> Etiquetas
                                                                        </Button>
                                                                        <Button variant="secondary" className="w-full justify-start h-8 text-sm font-normal bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                            <Calendar className="h-3.5 w-3.5 mr-2" /> Datas
                                                                        </Button>
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
                                                                                {task.startDate ? format(new Date(task.startDate), 'd MMM', { locale: ptBR }) : '...'} - {task.endDate ? format(new Date(task.endDate), 'd MMM', { locale: ptBR }) : '...'}
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
