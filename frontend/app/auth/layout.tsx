import React from 'react'

import { DarkModeParticles } from '@/components/dark-mode-particles'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background py-12 px-4">
      <DarkModeParticles />
      {/* Shared Background Elements to prevent flickering */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
      </div>

      {children}
    </div>
  )
}
