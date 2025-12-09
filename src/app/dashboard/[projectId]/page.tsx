import { getProject } from '@/actions';
import { DashboardTabs } from '@/components/dashboard/DashboardTabs';

export default async function DashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
    const { projectId } = await params;
    const result = await getProject(projectId);

    // Layout handles 404, but double check
    if (!result.success || !result.data) return null;

    const { tasks } = result.data;

    return (
        <div className="flex flex-col gap-4">
            <DashboardTabs tasks={tasks} />
        </div>
    );
}
