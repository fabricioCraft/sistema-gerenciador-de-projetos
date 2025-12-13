import { AppSidebar } from '@/components/dashboard/AppSidebar';
import { DashboardHeader } from '@/components/dashboard/Header';
import { ProjectChatAssistant } from '@/components/chat/ProjectChatAssistant';
import { getProject } from '@/actions';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    // Next.js 15: params is async in some contexts, but usually in layout props it's available or promise.
    // We'll await it if needed or check type.
    // Assuming standard Next.js 14/15 behavior.

    const paramsData = await params;
    const projectId = decodeURIComponent(paramsData.projectId);

    const result = await getProject(projectId);
    if (!result.success || !result.data) {
        // Handle 404
        redirect('/');
    }

    const project = result.data;

    return (
        <div className="grid min-h-screen w-full lg:grid-cols-[240px_1fr]">
            <AppSidebar projectId={projectId} />
            <div className="flex flex-col">
                <DashboardHeader projectName={project.name} />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 pb-20 relative">
                    {children}
                    <ProjectChatAssistant projectId={projectId} />
                </main>
            </div>
        </div>
    );
}
