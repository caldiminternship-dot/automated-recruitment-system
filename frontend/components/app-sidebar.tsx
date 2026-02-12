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
    useSidebar,
} from '@/components/animate-ui/components/radix/sidebar'
import {
    LayoutDashboard,
    Briefcase,
    FileText,
    Users,
    BarChart,
    Search,
    Clock,
    UserCheck,
    PanelLeft,
    LogOut,
    Settings,
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
    const { user, logout } = useAuth()
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
        <Sidebar collapsible="icon" {...props} className="border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl text-sidebar-foreground shadow-xl transition-colors duration-300">
            <SidebarHeader className="border-b border-sidebar-border px-4 py-6">
                <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
                    {/* User Profile Info */}
                    <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:hidden">
                        <Avatar className="h-10 w-10 border-2 border-sidebar-primary/20 shadow-sm ring-2 ring-sidebar-ring/50">
                            <AvatarImage src={`/avatars/${user?.role}.png`} />
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-sidebar-foreground truncate max-w-[120px]">
                                {user?.full_name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {user?.role === 'hr' ? 'HR Manager' : 'Candidate'}
                            </span>
                        </div>
                    </div>

                    {/* Collapse Button - hidden in mobile, shown in desktop */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="h-8 w-8 text-muted-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-full transition-colors group-data-[collapsible=icon]:rotate-180"
                    >
                        <PanelLeft className="h-4 w-4" />
                    </Button>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-4">
                <SidebarMenu className="gap-1">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href
                        
                        return (
                            <SidebarMenuItem key={link.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    tooltip={link.label}
                                    className="gap-3 rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-bold text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                                >
                                    <Link href={link.href}>
                                        <Icon className="h-5 w-5 shrink-0 transition-colors" />
                                        <span className="group-data-[collapsible=icon]:hidden">
                                            {link.label}
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={logout}
                            tooltip="Sign Out"
                            className="gap-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">
                                Sign Out
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            
            <SidebarRail />
        </Sidebar>
    )
}
