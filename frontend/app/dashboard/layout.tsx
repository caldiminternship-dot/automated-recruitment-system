'use client'

import React from "react"

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SidebarProvider, SidebarTrigger } from '@/components/animate-ui/components/radix/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { UserNav } from '@/components/user-nav'
import { ToggleTheme } from '@/components/lightswind/toggle-theme'
import { DarkModeParticles } from '@/components/dark-mode-particles'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, isMounted, router])

  if (!isMounted || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-transparent relative overflow-hidden">
        <DarkModeParticles />
        
        <AppSidebar />
        <div className="flex-1 flex flex-col min-h-screen relative z-10 transition-all duration-300">
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-6 bg-background/60 backdrop-blur-md sticky top-0 z-20 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto dark:hidden" />
              <img src="/logo-dark.png" alt="Logo" className="h-8 w-auto hidden dark:block" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-300 dark:to-violet-300">
                Caldim Recruitment Portal
              </h1>
            </div>


            <div className="flex items-center gap-4">
              <ToggleTheme animationType="circle-spread" />
              <UserNav />
            </div>
          </header>
          <div className="flex-1 p-6 md:p-8 overflow-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {children}
          </div>
        </div>
        
      </div>
    </SidebarProvider>
  )
}
