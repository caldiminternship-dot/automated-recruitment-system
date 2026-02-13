'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { APIClient } from '@/lib/api-client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface DashboardData {
  stats: {
    open_jobs: number
    total_applications: number
    pending_review: number
    active_interviews: number
    offers_made: number
  }
  chart_data: { name: string; value: number }[]
  recent_interviews: any[]
}

export default function HRDashboard() {
  const [stats, setStats] = useState({
    open_jobs: 0,
    total_applications: 0,
    pending_review: 0,
    active_interviews: 0,
    offers_made: 0
  })
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([])
  const [recentInterviews, setRecentInterviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await APIClient.get<DashboardData>('/api/analytics/dashboard')
        setStats(data.stats)
        setChartData(data.chart_data)
        setRecentInterviews(data.recent_interviews)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
            Recruitment Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Overview of your hiring pipeline and activities</p>
        </div>
        <Link href="/dashboard/hr/jobs/create">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all">
            <Briefcase className="mr-2 h-4 w-4" />
            Create Job Posting
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-0 fill-mode-both">
            <StatsCard
            title="Open Jobs"
            value={stats.open_jobs}
            icon={Briefcase}
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-500/10"
            />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-100 fill-mode-both">
            <StatsCard
            title="Pending Applications"
            value={stats.pending_review}
            icon={Users}
            color="text-orange-600 dark:text-orange-400"
            bg="bg-orange-500/10"
            />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-200 fill-mode-both">
            <StatsCard
            title="Active Interviews"
            value={stats.active_interviews}
            icon={Calendar}
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-500/10"
            />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out delay-300 fill-mode-both">
            <StatsCard
            title="Offers Made"
            value={stats.offers_made}
            icon={CheckCircle}
            color="text-green-600 dark:text-green-400"
            bg="bg-green-500/10"
            />
        </div>
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart Section */}
        <div className="lg:col-span-2 animate-in zoom-in-95 fade-in duration-1000 ease-out delay-300 fill-mode-both">
          <Card className="h-full shadow-lg border-border backdrop-blur-md bg-card/70">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Application Pipeline</CardTitle>
                  <CardDescription className="text-muted-foreground">Distribution of candidates by status</CardDescription>
                </div>
                <div className="p-2 bg-indigo-500/10 rounded-full">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40} activeBar={false}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <TrendingUp className="h-8 w-8 opacity-20" />
                    <p>No application data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Quick Actions */}
        <div className="space-y-6 animate-in slide-in-from-right-12 fade-in duration-1000 ease-out delay-500 fill-mode-both">
          <Card className="shadow-lg border-border backdrop-blur-md bg-card/70">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionButton href="/dashboard/hr/applications" label="Review Applications" />
              <ActionButton href="/dashboard/hr/pipeline" label="Hiring Pipeline" />
              <ActionButton href="/dashboard/hr/reports" label="View Reports" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900 text-white border-none shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-xl">✨</span> AI Insights
              </CardTitle>
              <CardDescription className="text-indigo-200">System Suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-100 leading-relaxed">
                {stats.pending_review > 5
                  ? "You have a high volume of pending applications. Consider using AI Batch Analysis to prioritize candidates."
                  : "Your pipeline is healthy. The AI is continuously monitoring for strong matches."}
              </p>
              <Button variant="secondary" size="sm" className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20 backdrop-blur-sm transition-all">
                Run Batch Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Interviews Table */}
      <Card className="shadow-md border-border animate-in slide-in-from-bottom-12 fade-in duration-1000 ease-out delay-700 fill-mode-both">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Interviews</CardTitle>
              <CardDescription>Upcoming and recently completed sessions</CardDescription>
            </div>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {recentInterviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInterviews.map((interview: any) => (
                  <TableRow key={interview.id}>
                    <TableCell className="font-medium">{interview.candidate_name}</TableCell>
                    <TableCell>{interview.job_title}</TableCell>
                    <TableCell>{new Date(interview.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        interview.status === 'completed' ? 'default' :
                          interview.status === 'scheduled' ? 'secondary' : 'outline'
                      } className={
                        interview.status === 'completed' ? 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 ' :
                          interview.status === 'scheduled' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500/20 ' : ''
                      }>
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/hr/applications`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No interviews scheduled recently.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="shadow-sm hover:shadow-lg transition-all duration-300 border-border backdrop-blur-md bg-card/70 group hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bg} group-hover:scale-110 transition-transform`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-extrabold ${color.replace('text-', 'text-')} tracking-tight`}>{value}</div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ href, label }: { href: string, label: string }) {
  return (
    <Link href={href} className="block group">
      <Button variant="outline" className="w-full justify-between hover:border-primary/50 hover:bg-primary/5 transition-all">
        {label}
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>
    </Link>
  )
}
