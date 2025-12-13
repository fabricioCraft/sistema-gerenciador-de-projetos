import { LayoutDashboard, Network, Settings, ListTodo, CalendarRange } from 'lucide-react';
import Link from 'next/link';

// Helper components for Sidebar menu to keep code clean
const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;
const SidebarMenuButton = ({ asChild, isActive, children }: { asChild?: boolean, isActive?: boolean, children: React.ReactNode }) => {
    const className = `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive
        ? 'text-gray-900 bg-gray-100 dark:bg-gray-800 dark:text-gray-50'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
        }`;

    // Simplification: We assume the child is an <a> tag if asChild is true, but styling wrapper is needed.
    // Ideally Shadcn Sidebar components should be used if available, but here we use the custom structure from before.
    return <div className={className}>{children}</div>;
};

export function AppSidebar({ projectId }: { projectId: string }) {
    return (
        <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40 w-[240px] h-full">
            {/* Note: Added fixed positioning and padding to account for header if needed, 
                 but Layout uses grid. We'll stick to simple div structure but ensure height is correct.
                 Actually, the grid layout in layout.tsx handles positioning. 
                 Let's just update the links.
              */}
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link className="flex items-center gap-2 font-semibold" href="/">
                        <Network className="h-6 w-6" />
                        <span className="">AI PMP</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        <ul className="flex flex-col gap-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/dashboard/${projectId}`} className="flex items-center gap-3 w-full">
                                        <LayoutDashboard className="h-4 w-4" />
                                        <span>Painel</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/dashboard/${projectId}/tasks`} className="flex items-center gap-3 w-full">
                                        <ListTodo className="h-4 w-4" />
                                        <span>Tarefas</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/dashboard/${projectId}/timeline`} className="flex items-center gap-3 w-full">
                                        <CalendarRange className="h-4 w-4" />
                                        <span>Cronograma</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/dashboard/${projectId}/network`} className="flex items-center gap-3 w-full">
                                        <Network className="h-4 w-4" />
                                        <span>Rede PERT</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild>
                                    <Link href={`/dashboard/${projectId}/settings`} className="flex items-center gap-3 w-full">
                                        <Settings className="h-4 w-4" />
                                        <span>Configurações</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
}
