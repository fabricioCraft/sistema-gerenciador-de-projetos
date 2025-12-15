import { getProject } from '@/actions';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { calculateSchedule } from '@/lib/scheduler';
import { AlertCircle, Calendar, CheckCircle2, Target, PlayCircle, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { format, isBefore, startOfToday, addDays, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskDistributionChart } from '@/components/dashboard/TaskDistributionChart';
import { AIInsightCard } from '@/components/dashboard/AIInsightCard';

export default async function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
    const paramsData = await params;
    const projectId = decodeURIComponent(paramsData.projectId);
    const result = await getProject(projectId);

    if (!result.success || !result.data) {
        return <div className="p-8">Projeto não encontrado.</div>;
    }

    const project = result.data;
    const { tasks } = result.data;

    // --- Data Calculation ---

    // 1. Basic Counts
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter(t => !t.status || t.status === 'todo');
    const doingTasks = tasks.filter(t => t.status === 'in_progress');
    const doneTasks = tasks.filter(t => t.status === 'done');

    const todoCount = todoTasks.length;
    const doingCount = doingTasks.length;
    const doneCount = doneTasks.length;

    // 2. Critical Path
    const mappedTasks = tasks.map(t => ({
        id: t.id,
        title: t.title || 'Sem título',
        duration: t.duration || 1,
        dependencies: t.dependencies || [],
        status: t.status
    }));
    const calculatedTasks = calculateSchedule(mappedTasks);
    const calculatedMap = new Map(calculatedTasks.map(t => [t.id, t]));

    // 3. Overdue & Deadlines
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to local midnight

    // Determine overdue (only for tasks not done)
    const overdueTasks = tasks.filter(t => {
        if (t.status === 'done') return false;
        if (!t.endDate) return false;
        const tDate = new Date(t.endDate);
        tDate.setHours(0, 0, 0, 0);
        return tDate < today;
    });
    const overdueCount = overdueTasks.length;

    // Split Critical Tasks (Urgent vs Safe)
    // isCritical comes from scheduler, but dates come from Supabase
    const criticalTasks = tasks.map(t => {
        const cal = calculatedMap.get(t.id);
        return { ...t, isCritical: cal?.isCritical };
    }).filter(t => t.isCritical && t.status !== 'done');

    const criticalUrgent = criticalTasks.filter(t => {
        if (!t.endDate) return false;
        const end = new Date(t.endDate);
        end.setHours(0, 0, 0, 0);
        return isBefore(end, addDays(today, 5)); // Urgent if due in < 5 days (includes overdue)
    }).length;

    const criticalSafe = criticalTasks.length - criticalUrgent;

    // Determine upcoming (immediate attention items not overdue)
    // Filter: within next 5 days (Today -> Today+5)
    const upcomingTasks = tasks.filter(t => {
        if (t.status === 'done' || !t.endDate) return false;
        const end = new Date(t.endDate);
        end.setHours(0, 0, 0, 0);

        // Exclude overdue (handled above)
        if (end < today) return false;

        const limit = addDays(today, 5);
        return isBefore(end, limit);
    }).sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime());

    // 7. Upcoming Milestones Logic (Next items in schedule)
    const immediateIds = new Set([...overdueTasks.map(t => t.id), ...upcomingTasks.map(t => t.id)]);

    // Get next 3 tasks that are not done and not immediate
    const displayMilestones = tasks
        .filter(t => t.status !== 'done' && !immediateIds.has(t.id) && t.endDate)
        .sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
        .slice(0, 3);

    // 4. Progress
    const progressPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

    // 5. Chart Data
    const chartData = [
        { status: 'todo', label: 'A Fazer', count: todoCount, fill: '#94a3b8' }, // Slate 400
        { status: 'doing', label: 'Em Andamento', count: doingCount, fill: '#6366f1' }, // Indigo 500
        { status: 'done', label: 'Concluído', count: doneCount, fill: '#22c55e' }, // Green 500
    ];

    // 6. AI Stats Object
    const aiStats = {
        total: totalTasks,
        todo: todoCount,
        doing: doingCount,
        done: doneCount,
        overdue: overdueCount,
        critical_urgent: criticalUrgent,
        critical_safe: criticalSafe
    };

    // Project end date: use the latest endDate from Supabase data
    const projectEndDate = tasks.reduce((latest, task) => {
        if (!task.endDate) return latest;
        const end = new Date(task.endDate);
        return !latest || end > latest ? end : latest;
    }, null as Date | null);

    return (
        <div className="space-y-8 p-1">

            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{project.name}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Visão Geral do Projeto & Analytics</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium text-slate-500">Previsão de Entrega</div>
                        <div className="text-lg font-semibold flex items-center justify-end gap-2">
                            <Calendar className="h-4 w-4" />
                            {projectEndDate ? format(projectEndDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não definida'}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Row 1: KPI Grid (Bento Style) --- */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* Total Tasks (Standard) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Progresso Total</CardTitle>
                        <Target className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progressPercentage}%</div>
                        <Progress value={progressPercentage} className="mt-2 h-1.5" />
                    </CardContent>
                </Card>

                {/* Doing (Highlighted) */}
                <Card className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Em Execução</CardTitle>
                        <PlayCircle className="h-4 w-4 text-indigo-600 animate-pulse" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">{doingCount}</div>
                        <p className="text-xs text-indigo-600/80 mt-1 font-medium">tarefas ativas agora</p>
                    </CardContent>
                </Card>

                {/* Done */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{doneCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">de {totalTasks} tarefas</p>
                    </CardContent>
                </Card>

                {/* Issues / Critical */}
                <Card className={overdueCount > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${overdueCount > 0 ? "text-red-700" : "text-muted-foreground"}`}>
                            Riscos & Atrasos
                        </CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${overdueCount > 0 ? "text-red-500" : "text-slate-400"}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-700 dark:text-red-400" : ""}`}>{overdueCount}</div>
                        <p className={`text-xs mt-1 ${overdueCount > 0 ? "text-red-600/80" : "text-muted-foreground"}`}>
                            tarefas atrasadas
                        </p>
                    </CardContent>
                </Card>

            </div>

            {/* --- Row 2: Main Content Area --- */}
            <div className="grid gap-6 md:grid-cols-3 h-[500px]">

                {/* Left Column (2/3) - AI & Tasks */}
                <div className="md:col-span-2 flex flex-col gap-6 h-full">

                    {/* Component 3: AI Executive Summary */}
                    <div className="min-h-[140px] shrink-0">
                        <AIInsightCard stats={aiStats} />
                    </div>

                    {/* Immediate Attention List */}
                    <Card className="flex-1 overflow-hidden flex flex-col">
                        <CardHeader className="py-4 px-6 border-b shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Atenção Imediata
                                </CardTitle>
                                <Badge variant="secondary" className="font-normal text-xs">
                                    {overdueCount + upcomingTasks.length} itens
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 overflow-y-auto flex-1">
                            {(overdueTasks.length === 0 && upcomingTasks.length === 0) ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                                    <CheckCircle2 className="h-10 w-10 text-green-500 mb-2 opacity-20" />
                                    <p className="text-sm">Tudo tranquilo por aqui.</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {/* Overdue Items */}
                                    {overdueTasks.map(task => (
                                        <Link
                                            key={task.id}
                                            href={`/dashboard/${projectId}/tasks?task=${task.id}`}
                                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center gap-4 group cursor-pointer"
                                        >
                                            <div className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium truncate text-sm text-slate-900 dark:text-slate-100">{task.title}</span>
                                                    {calculatedMap.get(task.id)?.isCritical && (
                                                        <Badge variant="destructive" className="h-4 px-1 text-[10px]">CRÍTICO</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-red-600 truncate flex items-center gap-1 font-bold animate-pulse">
                                                    ATRASADO • {task.endDate ? format(new Date(task.endDate), "dd/MM") : 'N/A'}
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="shrink-0 h-8 px-3 cursor-pointer bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 dark:hover:border-indigo-700 group/btn"
                                            >
                                                Abrir
                                                <ExternalLink className="h-3 w-3 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
                                            </Button>
                                        </Link>
                                    ))}

                                    {/* Upcoming Items */}
                                    {upcomingTasks.map(task => {
                                        const end = new Date(task.endDate!);
                                        const diff = differenceInCalendarDays(end, today);

                                        let label = `Vence em ${format(end, "dd MMM", { locale: ptBR })}`;
                                        let colorClass = "text-muted-foreground";
                                        let iconColor = "bg-blue-400";

                                        if (diff === 0) {
                                            label = "Vence Hoje";
                                            colorClass = "text-orange-600 font-bold";
                                            iconColor = "bg-orange-500";
                                        } else if (diff === 1) {
                                            label = "Vence Amanhã";
                                            colorClass = "text-amber-600 font-bold";
                                            iconColor = "bg-amber-400";
                                        }

                                        return (
                                            <Link
                                                key={task.id}
                                                href={`/dashboard/${projectId}/tasks?task=${task.id}`}
                                                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors flex items-center gap-4 group cursor-pointer"
                                            >
                                                <div className={`h-2 w-2 rounded-full ${iconColor} shrink-0`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium truncate text-sm text-slate-700 dark:text-slate-200">{task.title}</span>
                                                        {calculatedMap.get(task.id)?.isCritical && (
                                                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px] shrink-0">Crítico</Badge>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs ${colorClass} flex items-center gap-1`}>
                                                        {label}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="shrink-0 h-8 px-3 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 group/btn"
                                                >
                                                    Abrir
                                                    <ExternalLink className="h-3 w-3 ml-1.5 transition-transform group-hover/btn:translate-x-0.5" />
                                                </Button>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3) - Analytics */}
                <div className="md:col-span-1 flex flex-col gap-6 h-full">
                    {/* Component 2: Distribution Chart */}
                    <div className="h-[250px] shrink-0">
                        <TaskDistributionChart data={chartData} />
                    </div>

                    {/* Quick Milestones Preview */}
                    <Card className="flex-1 flex flex-col">
                        <CardHeader className="py-4 border-b shrink-0">
                            <CardTitle className="text-sm font-semibold">Próximos Marcos</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                {displayMilestones.length === 0 ? (
                                    <div className="text-xs text-muted-foreground italic">Nenhum marco pendente no cronograma.</div>
                                ) : (
                                    displayMilestones.map((t, i) => (
                                        <div key={t.id} className="flex items-start gap-3">
                                            <div className="bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold h-6 w-6 rounded flex items-center justify-center shrink-0 mt-0.5">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium leading-tight">{t.title}</p>
                                                {t.endDate && (
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(t.endDate), 'dd MMM', { locale: ptBR })}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <Link href={`/dashboard/${projectId}/timeline`} passHref>
                                    <Button variant="ghost" className="w-full justify-between text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 group">
                                        Ver cronograma completo
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
