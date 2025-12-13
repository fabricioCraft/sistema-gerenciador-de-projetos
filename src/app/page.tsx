import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { CreateProjectDialog } from '@/components/home/CreateProjectDialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Rocket, Calendar, ArrowRight } from 'lucide-react';

// ID de teste conforme encontrado em actions/ai-actions.ts
const TEST_USER_ID = "c4dfb583-c0d6-4898-bc01-5426475d7709";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const userProjects = await db.select()
    .from(projects)
    .where(eq(projects.userId, TEST_USER_ID))
    .orderBy(desc(projects.createdAt));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
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

        {/* Content */}
        {userProjects.length === 0 ? (
          <EmptyState />
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center animate-in fade-in-50">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-6">
        <Rocket className="h-10 w-10 text-blue-500" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Nenhum projeto encontrado</h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        Você ainda não criou nenhum projeto. Utilize nossa IA para gerar seu primeiro plano de projeto completo.
      </p>
      {/* O botão já está no header, mas podemos colocar uma call to action aqui também ou apenas instruir */}
      <CreateProjectDialog />
    </div>
  );
}
