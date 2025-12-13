import { getProject } from '@/actions';
import { GanttChart } from '@/components/visualizations/GanttChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function TimelinePage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const result = await getProject(projectId);

    if (!result.success || !result.data) return <div>Project not found</div>;

    const { tasks } = result.data;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Linha do Tempo</CardTitle>
                <CardDescription>Visualização em Gráfico de Gantt.</CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] border rounded-md p-2">
                <GanttChart tasks={tasks} projectId={projectId} />
            </CardContent>
        </Card>
    );
}
