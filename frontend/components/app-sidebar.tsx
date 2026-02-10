'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    useSidebar,
} from '@/components/ui/sidebar'
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    BarChart,
    Search,
    Clock,
    UserCheck,
    LogOut,
    Menu,
    PanelLeft,
} from 'lucide-react'
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useAuth()
    const pathname = usePathname()
    const { toggleSidebar, state } = useSidebar()

    // Get initials for avatar fallback
    const initials = user?.full_name
        ? user.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U'

    // Determine navigation links based on user role
    const links = user?.role === 'candidate'
        ? [
            { href: '/dashboard/candidate', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/dashboard/candidate/jobs', label: 'Browse Jobs', icon: Search },
            { href: '/dashboard/candidate/applications', label: 'My Applications', icon: FileText },
            { href: '/dashboard/candidate/interviews', label: 'Interviews', icon: Clock },
        ]
        : [
            { href: '/dashboard/hr', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/dashboard/hr/jobs', label: 'Job Postings', icon: Briefcase },
            { href: '/dashboard/hr/applications', label: 'Applications', icon: Users },
            { href: '/dashboard/hr/pipeline', label: 'Hiring Pipeline', icon: UserCheck },
            { href: '/dashboard/hr/reports', label: 'Reports', icon: BarChart },
        ]

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white border-b border-indigo-900/30 transition-all duration-300">
                <div className={cn(
                    "flex items-center px-2 py-3 transition-all duration-300",
                    state === 'collapsed' ? "justify-center" : "justify-between"
                )}>
                    {/* User Profile Info - Hides when collapsed */}
                    <div className={cn(
                        "flex items-center gap-3 overflow-hidden transition-all duration-300 ease-in-out",
                        state === 'collapsed' ? "w-0 opacity-0" : "w-auto opacity-100"
                    )}>
                        <Avatar className="h-14 w-14 border-2 border-indigo-400/30 shadow-sm shrink-0">
                            <AvatarImage src={`/avatars/${user?.role}.png`} />
                            <AvatarFallback className="bg-indigo-500 text-white text-xl font-bold">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left leading-tight">
                            <span className="truncate font-bold text-lg text-white">{user?.full_name || 'User'}</span>
                            <span className="truncate text-sm text-indigo-200">{user?.email}</span>
                        </div>
                    </div>

                    {/* Internal Toggle Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 text-indigo-300 hover:text-white hover:bg-indigo-800/50 shrink-0"
                    >
                        <PanelLeft className={cn(
                            "h-5 w-5 transition-transform duration-500 ease-spring",
                            state === 'collapsed' ? "rotate-180" : "rotate-0"
                        )} />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-gradient-to-b from-blue-950 via-indigo-950 to-slate-950 text-white">
                <SidebarMenu className="p-2 gap-2">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        return (
                            <SidebarMenuItem key={link.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={link.label}
                                    className={cn(
                                        "text-blue-100 hover:bg-blue-800/50 hover:text-white transition-all duration-200",
                                        isActive && "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-600"
                                    )}
                                >
                                    <Link href={link.href}>
                                        <Icon className="size-4" />
                                        <span>{link.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="bg-slate-950 text-white border-t border-indigo-900/30 p-4">
                {/* Footer content if needed */}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
