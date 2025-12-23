import Link from 'next/link';
import { AvatarUploader } from '@/components/user/AvatarUploader';
import { getCurrentUser } from '@/actions/user';
import { LayoutDashboard, Network, Settings, ListTodo, CalendarRange, LogOut, User as UserIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { KiraLogo } from '@/components/ui/kira-logo';

// Helper components for Sidebar menu to keep code clean
const SidebarMenuItem = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;
const SidebarMenuButton = ({ asChild, isActive, children }: { asChild?: boolean, isActive?: boolean, children: React.ReactNode }) => {
    const className = `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${isActive
        ? 'text-gray-900 bg-gray-100 dark:bg-gray-800 dark:text-gray-50'
        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50'
        }`;

    return <div className={className}>{children}</div>;
};

export async function AppSidebar({ projectId }: { projectId: string }) {
    const user = await getCurrentUser();

    return (
        <div className="hidden border-r bg-gray-100/40 lg:block dark:bg-gray-800/40 w-[240px] h-full">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                        <KiraLogo className="h-8 w-auto text-slate-900 dark:text-white" />
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

                {/* User Menu Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors group">
                        {/* Avatar com Upload - Click handled internally */}
                        <AvatarUploader user={user} />

                        {/* User Details & Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex-1 text-left min-w-0 outline-none cursor-pointer">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{user?.fullName || 'Usuário'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email || 'user@example.com'}</p>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[200px]" side="right" sideOffset={10}>
                                <DropdownMenuItem className="cursor-pointer">
                                    <UserIcon className="mr-2 h-4 w-4" /> Perfil
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" /> Sair
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
