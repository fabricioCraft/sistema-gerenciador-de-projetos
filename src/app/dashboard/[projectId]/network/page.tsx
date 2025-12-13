import { getProject } from '@/actions';
import { NetworkGraph } from '@/components/visualizations/NetworkGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NetworkPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const result = await getProject(projectId);

    if (!result.success || !result.data) return <div>Project not found</div>;

    const { tasks } = result.data;

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Rede de Dependências</CardTitle>
                <CardDescription>Gráfico PERT/CPM destacando o caminho crítico.</CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] p-0 border rounded-md overflow-hidden relative">
                <NetworkGraph tasks={tasks} />
            </CardContent>
        </Card>
    );
}
