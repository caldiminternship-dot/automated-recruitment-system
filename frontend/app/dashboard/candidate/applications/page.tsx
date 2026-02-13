'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Application {
    id: number
    status: string
    applied_at: string
    job: {
        id: number
        title: string
        company: string
        status: string
    }
}

export default function CandidateApplicationsPage() {
    const router = useRouter()
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isStarting, setIsStarting] = useState(false)

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<Application[]>('/api/applications/my-applications')
            setApplications(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartInterview = async (applicationId: number) => {
        setIsStarting(true)
        try {
            const interview = await APIClient.post<any>('/api/interviews/start', { application_id: applicationId })
            router.push(`/interview/${interview.id}`)
        } catch (err: any) {
            // Check if error indicates existing interview
            if (err.message && (err.message.includes('exists') || err.message.includes('400'))) {
                // Option: we could try to fetch the existing interview ID, but for now redirecting to the list is safer
                // or just alert the user more clearly
                alert('You already have an active interview for this job. Please verify in the "Interviews" tab.')
                router.push('/dashboard/candidate/interviews')
            } else {
                // DEBUG: Show actual error
                alert(`Could not start interview: ${err.message || "Unknown error"}`)
                console.error("Start Interview Error:", err)
            }
        } finally {
            setIsStarting(false)
        }
    }

    // Filter Logic
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('newest')

    const filteredApplications = applications.filter(app => {
        const matchesSearch = app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
        let matchesStatus = statusFilter === 'all' || app.status === statusFilter

        // Handle rejected status variants
        if (statusFilter === 'rejected') {
            matchesStatus = app.status === 'rejected' || app.status === 'rejected_post_interview'
        }

        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
        if (sortBy === 'oldest') return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
        return 0
    })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Applications</h1>
            <p className="text-muted-foreground mb-8">Track your status and take interviews.</p>

            {/* Filter Toolbar */}
            <div className="bg-card p-4 rounded-lg border border-border shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by job title..."
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm bg-background text-foreground"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <select
                        className="px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="submitted">Submitted</option>
                        <option value="approved_for_interview">Approved for Interview</option>
                        <option value="interview_completed">Interview Completed</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <select
                        className="px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <h3 className="text-lg font-medium text-foreground mb-2">No applications match your filtering criteria</h3>
                    <p className="text-muted-foreground mb-6">Start applying for jobs to see them here.</p>
                    <Link href="/dashboard/candidate/jobs">
                        <Button>Browse Jobs</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredApplications.map((app, index) => (
                        <Card key={app.id} style={{ animationDelay: `${index * 100}ms` }} className="bg-card border-border hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                            <CardHeader>
                                <CardTitle>{app.job.title}</CardTitle>
                                <CardDescription>Applied on {new Date(app.applied_at).toLocaleDateString()}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Job Closed Warning */}
                                    {app.job.status === 'closed' && (
                                        <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded mb-4">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-orange-600 dark:text-orange-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                                        ⚠️ Job Posting Closed
                                                    </p>
                                                    <p className="mt-1 text-xs text-orange-700 dark:text-orange-400">
                                                        This job posting has been closed by the employer. No further action can be taken on this application.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${app.status === 'approved_for_interview' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
                                            app.status === 'rejected' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                                                app.status === 'hired' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                                                    app.status === 'rejected_post_interview' ? 'bg-red-500/10 text-red-700 dark:text-red-400' :
                                                        'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                            }`}>
                                            {app.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Contextual Messages & Actions */}
                                    {app.status === 'submitted' && (
                                        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                                        Your application is being analyzed by HR
                                                    </p>
                                                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                                                        You'll be notified once HR reviews your application.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {app.status === 'approved_for_interview' && (
                                        <div className="space-y-3">
                                            <div className="bg-green-500/10 border-l-4 border-green-500 p-4 rounded">
                                                <div className="flex items-start">
                                                    <div className="flex-shrink-0">
                                                        <svg className="h-5 w-5 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                                            Congratulations! You're approved for the AI interview
                                                        </p>
                                                        <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                                                            Click the button below to start your interview.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => handleStartInterview(app.id)}
                                                disabled={isStarting}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                                            >
                                                {isStarting ? 'Starting Interview...' : '🎯 Start AI Interview'}
                                            </Button>
                                        </div>
                                    )}

                                    {app.status === 'hired' && (
                                        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                                        🎉 Congratulations! You've been hired!
                                                    </p>
                                                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
                                                        HR will contact you soon with next steps.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {app.status === 'rejected' && (
                                        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                                        Application not selected
                                                    </p>
                                                    <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                                                        Thank you for your interest. We encourage you to apply for other positions.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {app.status === 'rejected_post_interview' && (
                                        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                                        Not selected after interview
                                                    </p>
                                                    <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                                                        Thank you for completing the interview. We'll keep your profile for future opportunities.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Default message for other statuses (e.g., interview in progress or completed awaiting decision) */}
                                    {!['submitted', 'approved_for_interview', 'hired', 'rejected', 'rejected_post_interview'].includes(app.status) && (
                                        <div className="bg-purple-500/10 border-l-4 border-purple-500 p-4 rounded">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                                                        Interview completed! Results will be out soon.
                                                    </p>
                                                    <p className="mt-1 text-xs text-purple-700 dark:text-purple-400">
                                                        HR is reviewing your interview performance. You'll be notified once a decision is made.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
