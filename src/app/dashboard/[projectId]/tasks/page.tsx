import { getProject } from '@/actions';
import { TaskBoard } from '@/components/kanban/TaskBoard';
import { calculateSchedule } from '@/lib/scheduler';

export default async function TasksPage({ params }: { params: Promise<{ projectId: string }> }) {
    const paramsData = await params;
    const projectId = decodeURIComponent(paramsData.projectId);
    const result = await getProject(projectId);

    if (!result.success || !result.data) return <div>Project not found</div>;

    const { tasks } = result.data;

    // 1. Prepare tasks for scheduler to calculate Critical Path
    const mappedForScheduler = tasks.map(t => ({
        id: t.id,
        title: t.title || 'Untitled',
        duration: t.duration || 0,
        dependencies: t.dependencies || [],
    }));

    // 2. Calculate
    const calculatedSchedule = calculateSchedule(mappedForScheduler);
    const scheduleMap = new Map(calculatedSchedule.map(t => [t.id, t]));

    // 3. Merge 'isCritical' back into display tasks
    const tasksWithCriticalInfo = tasks.map(t => {
        const scheduled = scheduleMap.get(t.id);
        return {
            ...t,
            isCritical: scheduled?.isCritical || false,
            // Override with calculated dates for visualization
            startDate: scheduled?.startDate || t.startDate,
            endDate: scheduled?.endDate || t.endDate,
        };
    });

    // 4. Sort by Logical Sequence (Start Date ASC -> Critical Priority)
    const sortedTasks = tasksWithCriticalInfo.sort((a, b) => {
        // 1. Start Date Ascending
        const dateA = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;

        if (dateA !== dateB) return dateA - dateB;

        // 2. Critical First (Tie-breaker)
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;

        return 0;
    });

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quadro de Tarefas</h1>
                    <p className="text-muted-foreground">Gerencie o fluxo de trabalho do projeto.</p>
                </div>
                {/* Future: Filters, Add Task Button */}
            </div>

            <div className="flex-1 overflow-hidden">
                <TaskBoard tasks={sortedTasks} projectId={projectId} />
            </div>
        </div>
    );
}
