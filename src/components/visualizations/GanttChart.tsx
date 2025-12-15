'use client';

import { Gantt, Task as GanttTask, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { useMemo, useState, useRef } from 'react';
import { updateTaskAndPropagate, auditSchedule } from '@/actions';
import { SyncScheduleButton } from '@/components/dashboard/SyncScheduleButton';
import { toast } from 'sonner';

// Helper for formatting dates in Portuguese
const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

// Custom Tooltip Component (Shadcn Style)
const CustomTooltip = ({ task, fontSize, fontFamily }: { task: GanttTask, fontSize: string, fontFamily: string }) => {
    const duration = Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 3600 * 24));

    return (
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-lg rounded-lg p-3 min-w-[200px] z-50 relative pointer-events-none">
            <div className="font-bold text-sm mb-1 text-slate-800 dark:text-slate-100" style={{ fontFamily }}>
                {task.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1" style={{ fontFamily, fontSize }}>
                {formatDate(task.start)} - {formatDate(task.end)}
            </div>
            <div className="text-xs text-slate-400" style={{ fontFamily, fontSize }}>
                Duração: {duration} {duration === 1 ? 'dia' : 'dias'}
            </div>
        </div>
    );
};

// Custom List Header (Only Title)
const TaskListHeader = ({ headerHeight, rowWidth }: any) => {
    return (
        <div
            className="flex items-center border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            style={{
                height: headerHeight,
                fontFamily: "Inter, sans-serif",
                fontSize: "0.875rem",
            }}
        >
            <div
                className="px-4 font-semibold text-slate-600 dark:text-slate-300"
                style={{
                    minWidth: rowWidth,
                }}
            >
                Tarefa
            </div>
        </div>
    );
};

// Custom List Table (Only Title)
const TaskListTable = ({
    rowHeight,
    rowWidth,
    tasks,
    onExpanderClick,
}: any) => {
    return (
        <div
            className="border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "0.875rem" }}
        >
            {tasks.map((t: any) => (
                <div
                    className="flex items-center border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                    style={{ height: rowHeight }}
                    key={t.id}
                    onClick={() => onExpanderClick(t)}
                >
                    <div
                        className="px-4 truncate w-full font-medium text-slate-700 dark:text-slate-200"
                        style={{
                            minWidth: rowWidth,
                            maxWidth: rowWidth,
                        }}
                        title={t.name}
                    >
                        {t.name}
                    </div>
                </div>
            ))}
        </div>
    );
};

export function GanttChart({ tasks, projectId }: { tasks: any[], projectId: string }) {
    const [viewMode, setViewMode] = useState(ViewMode.Day);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const scheduledTasks = useMemo(() => {
        // Build a map for quick lookup
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        // Calculate critical path based on dependencies
        // A task is critical if it has zero slack (no buffer time)
        // For simplicity: tasks with dependencies on the longest chain are critical
        const calculateCriticalPath = () => {
            const criticalIds = new Set<string>();

            // Find the task with the latest end date (project end)
            let maxEndTime = 0;
            let endTaskId: string | null = null;

            tasks.forEach(t => {
                if (t.endDate) {
                    const endTime = new Date(t.endDate).getTime();
                    if (endTime > maxEndTime) {
                        maxEndTime = endTime;
                        endTaskId = t.id;
                    }
                }
            });

            // Trace back from end task through dependencies
            const traceBack = (taskId: string) => {
                criticalIds.add(taskId);
                const task = taskMap.get(taskId);
                if (!task) return;

                const deps = task.dependencies || [];
                if (deps.length === 0) return;

                // Find the dependency that ends latest (critical predecessor)
                let latestDep: string | null = null;
                let latestEnd = 0;

                deps.forEach((depId: string) => {
                    const dep = taskMap.get(depId);
                    if (dep?.endDate) {
                        const depEnd = new Date(dep.endDate).getTime();
                        if (depEnd > latestEnd) {
                            latestEnd = depEnd;
                            latestDep = depId;
                        }
                    }
                });

                if (latestDep) {
                    traceBack(latestDep);
                }
            };

            if (endTaskId) {
                traceBack(endTaskId);
            }

            return criticalIds;
        };

        const criticalIds = calculateCriticalPath();

        // Helper to normalize dates using UTC components to match Supabase storage
        // This ensures the displayed date matches what's stored in the database
        const normalizeToLocalDate = (dateInput: string | Date): Date => {
            const date = new Date(dateInput);
            // Use UTC components to avoid timezone shift
            return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0);
        };

        return tasks
            .filter(t => t.startDate && t.endDate) // Only show tasks with dates
            .map(t => {
                const start = normalizeToLocalDate(t.startDate);
                const end = normalizeToLocalDate(t.endDate);
                const isCritical = criticalIds.has(t.id);

                return {
                    start: start,
                    end: end,
                    name: t.title,
                    id: t.id,
                    type: 'task',
                    progress: isCritical ? 100 : 50,
                    isDisabled: false,
                    // Enterprise Look Colors
                    styles: {
                        backgroundColor: isCritical ? '#ef4444' : '#2563eb', // Red-500 or Blue-600
                        progressColor: isCritical ? '#b91c1c' : '#1e40af', // Red-700 or Blue-800
                        progressSelectedColor: isCritical ? '#991b1b' : '#1e3a8a',
                    },
                    dependencies: t.dependencies || [],
                } as GanttTask;
            });
    }, [tasks]);

    const handleTaskChange = async (task: GanttTask) => {
        setIsUpdating(true);

        // Mostra toast de loading enquanto recalcula
        const loadingToastId = toast.loading('Reagendando tarefa...', {
            description: 'Calculando impacto nas dependências.'
        });

        try {
            const result = await updateTaskAndPropagate(task.id, task.start, task.end);

            // Fecha o toast de loading
            toast.dismiss(loadingToastId);

            if (result.success) {
                toast.success('Cronograma atualizado!', {
                    description: 'A tarefa e suas dependências foram reagendadas.'
                });
            } else {
                toast.error('Erro ao mover tarefa', {
                    description: result.error || 'Erro desconhecido.'
                });
            }
        } catch (e: any) {
            toast.dismiss(loadingToastId);
            toast.error('Erro crítico', {
                description: e.message || 'Erro ao atualizar tarefa.'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAudit = async () => {
        if (!confirm("Executar Auditoria de Prazos com IA (Simulação)?")) return;

        // Mostra toast de loading durante a auditoria
        const loadingToastId = toast.loading('Auditando cronograma...', {
            description: 'Analisando tarefas atrasadas.'
        });

        const result = await auditSchedule(projectId);

        // Fecha o toast de loading
        toast.dismiss(loadingToastId);

        if (result.success && result.data) {
            const issues = result.data;
            if (issues.length === 0) {
                toast.success('Cronograma saudável!', {
                    description: 'Nenhuma tarefa atrasada encontrada.'
                });
            } else {
                const msg = `Encontradas ${issues.length} tarefas atrasadas.\n` +
                    issues.map((i: any) => `- ${i.taskTitle}: Atrasada em ${i.delay} dias. Sugestão: Mover para ${new Date(i.proposedEnd).toLocaleDateString()}`).join('\n');

                if (confirm(msg + "\n\nAplicar correções automaticamente?")) {
                    // Mostra toast de loading durante as correções
                    const fixingToastId = toast.loading('Aplicando correções...', {
                        description: `Reagendando ${issues.length} tarefas.`
                    });

                    // Apply fixes loop
                    for (const issue of issues) {
                        await updateTaskAndPropagate(issue.taskId, new Date(), new Date(issue.proposedEnd)); // Start today, End Proposed
                    }

                    toast.dismiss(fixingToastId);
                    toast.success('Correções aplicadas!', {
                        description: `${issues.length} tarefas foram reagendadas.`
                    });
                }
            }
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.shiftKey) return;
        if (containerRef.current) {
            containerRef.current.scrollLeft += e.deltaY;
        }
    };

    if (tasks.length === 0) return <div>No tasks to display.</div>;

    // Calculate dynamic height: (tasks * rowHeight) + headerHeight (approx 55px) + buffer
    const ganttHeight = tasks.length * 50 + 60;

    return (
        <div className="flex flex-col w-full gap-4">
            <div className="flex gap-2 sticky left-0 z-10 w-full justify-between items-center">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode(ViewMode.Hour)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${viewMode === ViewMode.Hour
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        Horas
                    </button>
                    <button
                        onClick={() => setViewMode(ViewMode.Day)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${viewMode === ViewMode.Day
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        Dias
                    </button>
                </div>

                <div className="flex gap-2 items-center">
                    <SyncScheduleButton projectId={projectId} variant="outline" size="sm" />

                    <button
                        onClick={handleAudit}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-medium hover:bg-amber-200 transition-colors"
                    >
                        ⚠️ Auditar Prazos (IA)
                    </button>
                </div>
            </div>

            {isUpdating && <div className="text-xs text-blue-600 animate-pulse">Synchronizing changes...</div>}

            <div
                ref={containerRef}
                onWheel={handleWheel}
                className="w-full border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden"
                style={{ height: `${ganttHeight}px` }}
            >
                <Gantt
                    tasks={scheduledTasks}
                    viewMode={viewMode}
                    columnWidth={65}
                    listCellWidth="350px"
                    rowHeight={50}
                    barFill={60}
                    barCornerRadius={4}
                    fontFamily="Inter, sans-serif"
                    TooltipContent={CustomTooltip}
                    TaskListHeader={TaskListHeader}
                    TaskListTable={TaskListTable}
                    locale="pt-BR"
                    onDateChange={handleTaskChange}
                />
            </div>
        </div>
    );
}
