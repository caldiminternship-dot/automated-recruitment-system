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

export default function HRDashboard() {
  const [stats, setStats] = useState({
    open_jobs: 0,
    total_applications: 0,
    pending_review: 0,
    active_interviews: 0,
    offers_made: 0
  })
  const [chartData, setChartData] = useState([])
  const [recentInterviews, setRecentInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await APIClient.get('/api/analytics/dashboard')
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
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
            Recruitment Dashboard
          </h1>
          <p className="text-slate-500 mt-2">Overview of your hiring pipeline and activities</p>
        </div>
        <Link href="/dashboard/hr/jobs/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
            <Briefcase className="mr-2 h-4 w-4" />
            Create Job Posting
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Open Jobs"
          value={stats.open_jobs}
          icon={Briefcase}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatsCard
          title="Pending Applications"
          value={stats.pending_review}
          icon={Users}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <StatsCard
          title="Active Interviews"
          value={stats.active_interviews}
          icon={Calendar}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatsCard
          title="Offers Made"
          value={stats.offers_made}
          icon={CheckCircle}
          color="text-green-600"
          bg="bg-green-50"
        />
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart Section */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-md border-slate-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Application Pipeline</CardTitle>
                  <CardDescription>Distribution of candidates by status</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        stroke="#64748B"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: '#F1F5F9' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    No application data available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Quick Actions */}
        <div className="space-y-6">
          <Card className="shadow-md border-slate-100">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionButton href="/dashboard/hr/applications" label="Review Applications" />
              <ActionButton href="/dashboard/hr/pipeline" label="Hiring Pipeline" />
              <ActionButton href="/dashboard/hr/reports" label="View Reports" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-white">AI Insights</CardTitle>
              <CardDescription className="text-indigo-200">System Suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-indigo-100">
                {stats.pending_review > 5
                  ? "You have a high volume of pending applications. Consider using AI Batch Analysis."
                  : "Your pipeline is healthy. Check back later for new candidates."}
              </p>
              <Button variant="secondary" size="sm" className="mt-4 w-full bg-white/10 hover:bg-white/20 text-white border-0">
                Run Batch Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Interviews Table */}
      <Card className="shadow-md border-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Interviews</CardTitle>
              <CardDescription>Upcoming and recently completed sessions</CardDescription>
            </div>
            <Clock className="h-5 w-5 text-slate-400" />
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
                        interview.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          interview.status === 'scheduled' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''
                      }>
                        {interview.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/hr/applications`} className="text-blue-600 hover:underline text-sm font-medium">
                        View Details
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
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
    <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-100 cursor-default">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ href, label }: { href: string, label: string }) {
  return (
    <Link href={href} className="block group">
      <Button variant="outline" className="w-full justify-between hover:border-blue-300 hover:bg-blue-50 transition-all">
        {label}
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </Button>
    </Link>
  )
}
