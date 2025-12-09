'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function TaskTable({ tasks }: { tasks: any[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Tarefa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Est. (O/M/P)</TableHead>
                        <TableHead>Duração (PERT)</TableHead>
                        <TableHead className="text-right">Dependências</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>
                                <Badge variant={task.status === 'done' ? 'default' : 'outline'}>
                                    {task.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{task.estOptimistic}/{task.estLikely}/{task.estPessimistic}</TableCell>
                            <TableCell>{task.duration}h</TableCell>
                            <TableCell className="text-right">{task.dependencies?.length || 0}</TableCell>
                        </TableRow>
                    ))}
                    {tasks.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">Nenhuma tarefa encontrada.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
