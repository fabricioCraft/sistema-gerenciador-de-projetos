import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateProjectDialog } from '@/components/home/CreateProjectDialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Rocket, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';

export const dynamic = 'force-dynamic';

export default async function DashboardProjects() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const userProjects = await db.select()
        .from(projects)
        .where(eq(projects.userId, user.id))
        .orderBy(desc(projects.createdAt));

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 flex flex-col">
            <div className="max-w-6xl mx-auto w-full space-y-8 flex-1">

                {/* Header only shows if there are projects, otherwise EmptyState handles the hero */}
                {userProjects.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Meus Projetos
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Gerencie seus planos e acompanhe o progresso.
                            </p>
                        </div>
                        <CreateProjectDialog />
                    </div>
                )}

                {/* Content */}
                {userProjects.length === 0 ? (
                    <DashboardEmptyState />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {userProjects.map((project) => (
                            <Link key={project.id} href={`/dashboard/${project.id}`} className="block group">
                                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-blue-500/50 cursor-pointer">
                                    <CardHeader>
                                        <div className="flex justify-between items-start gap-4">
                                            <CardTitle className="text-xl font-semibold leading-tight group-hover:text-blue-600 transition-colors">
                                                {project.name}
                                            </CardTitle>
                                            <StatusBadge status={project.status || 'planning'} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="line-clamp-2 text-sm min-h-[40px]">
                                            {project.description || 'Sem descrição.'}
                                        </CardDescription>
                                    </CardContent>
                                    <CardFooter className="text-xs text-muted-foreground flex items-center gap-2 border-t pt-4">
                                        <Calendar className="h-3 w-3" />
                                        Criado em {project.createdAt ? format(project.createdAt, "d 'de' MMMM", { locale: ptBR }) : '-'}
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        planning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200",
        active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
        completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
        default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200"
    };

    const statusKey = status.toLowerCase() as keyof typeof styles;
    const className = styles[statusKey] || styles.default;

    const labels = {
        planning: "Planejamento",
        active: "Em Andamento",
        completed: "Concluído"
    };

    return (
        <Badge variant="outline" className={`${className} capitalize whitespace-nowrap`}>
            {labels[statusKey as keyof typeof labels] || status}
        </Badge>
    );
}
