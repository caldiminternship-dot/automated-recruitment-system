'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CandidateDashboard() {
  return (
    <div className="p-8">
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Total submitted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interviews</CardTitle>
            <CardDescription>Scheduled & completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunities</CardTitle>
            <CardDescription>Available jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Welcome to Caldim Recruitment Portal</h3>
            <p className="text-blue-800 text-sm mb-4">
              Start by browsing available job opportunities and submit your application with your resume.
            </p>
            <a href="/dashboard/candidate/jobs" className="text-blue-600 hover:text-blue-700 font-semibold">
              Browse Jobs →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
