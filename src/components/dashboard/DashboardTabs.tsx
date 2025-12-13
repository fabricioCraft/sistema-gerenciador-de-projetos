'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskTable } from '@/components/visualizations/TaskTable';
import { GanttChart } from '@/components/visualizations/GanttChart';
import { NetworkGraph } from '@/components/visualizations/NetworkGraph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DashboardTabs({ tasks, projectId }: { tasks: any[], projectId: string }) {
    return (
        <Tabs defaultValue="list" className="w-full">
            <div className="flex items-center justify-between">
                <TabsList>
                    <TabsTrigger value="list">Lista</TabsTrigger>
                    <TabsTrigger value="gantt">Gantt</TabsTrigger>
                    <TabsTrigger value="network">Rede PERT</TabsTrigger>
                </TabsList>
            </div>
            <TabsContent value="list" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Tarefas do Projeto</CardTitle>
                        <CardDescription>Lista de todas as tarefas do projeto atual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TaskTable tasks={tasks} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="gantt" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Linha do Tempo</CardTitle>
                        <CardDescription>Visualização em Gráfico de Gantt.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[500px]">
                        <GanttChart tasks={tasks} projectId={projectId} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="network" className="mt-4">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Rede de Dependências</CardTitle>
                        <CardDescription>Gráfico PERT/CPM destacando o caminho crítico.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[600px] p-0 border rounded-md overflow-hidden relative">
                        <NetworkGraph tasks={tasks} />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
