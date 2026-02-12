'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { APIClient } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

interface DashboardStats {
    applications: number
    interviews: number
    opportunities: number
}

export default function CandidateDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
      applications: 0,
      interviews: 0,
      opportunities: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
      const fetchStats = async () => {
          try {
              const data = await APIClient.get<DashboardStats>('/api/analytics/candidate/dashboard')
              setStats(data)
          } catch (error) {
              console.error('Failed to fetch dashboard stats:', error)
          } finally {
              setLoading(false)
          }
      }

      fetchStats()
  }, [])

  return (
    <div className="p-8">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-0 fill-mode-both">
            <Card className="bg-gradient-to-br from-card to-indigo-50/50 dark:to-indigo-950/20 backdrop-blur-xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-sm hover:shadow-indigo-200/50 transition-all duration-300 group hover:-translate-y-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground font-bold group-hover:text-primary transition-colors flex justify-between items-center">
                    Applications
                    <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Total submitted</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-extrabold text-primary tracking-tight">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary/50" /> : stats.applications}
                </div>
            </CardContent>
            </Card>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-100 fill-mode-both">
            <Card className="bg-gradient-to-br from-card to-purple-50/50 dark:to-purple-950/20 backdrop-blur-xl border border-purple-100/50 dark:border-purple-900/30 shadow-sm hover:shadow-purple-200/50 transition-all duration-300 group hover:-translate-y-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex justify-between items-center">
                    Interviews
                    <div className="p-2 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Scheduled & completed</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin text-purple-300" /> : stats.interviews}
                </div>
            </CardContent>
            </Card>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-200 fill-mode-both">
            <Card className="bg-gradient-to-br from-card to-emerald-50/50 dark:to-emerald-950/20 backdrop-blur-xl border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm hover:shadow-emerald-200/50 transition-all duration-300 group hover:-translate-y-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-foreground font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex justify-between items-center">
                    Opportunities
                    <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/30 rounded-lg group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Available jobs</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {loading ? <Loader2 className="h-8 w-8 animate-spin text-emerald-300" /> : stats.opportunities}
                </div>
            </CardContent>
            </Card>
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border border-indigo-100/50 dark:border-indigo-900/30 shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden animate-in zoom-in-95 fade-in duration-1000 ease-out delay-300 fill-mode-both">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
             <span className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg shadow-sm">🚀</span> 
             Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-8 bg-gradient-to-br from-indigo-50 via-blue-50 to-white dark:from-indigo-950/20 dark:via-blue-950/20 dark:to-card rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform translate-x-4 group-hover:translate-x-0">
                <div className="w-48 h-48 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
            </div>
            
            <h3 className="font-bold text-2xl text-foreground mb-3 relative z-10">Welcome to Caldim Recruitment Portal</h3>
            <p className="text-muted-foreground text-base mb-8 max-w-2xl relative z-10 leading-relaxed">
              Start by browsing available job opportunities and submit your application with your resume. Our AI-powered system will help match you with the best roles tailored to your skills.
            </p>
            <a href="/dashboard/candidate/jobs" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 relative z-10">
              Browse Jobs
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
