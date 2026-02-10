'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIClient } from '@/lib/api-client'
import Link from 'next/link'

interface Application {
    id: number
    status: string
    applied_at: string
    candidate: {
        full_name: string
        email: string
    }
    job: {
        title: string
    }
    resume_extraction: {
        resume_score: number
        skill_match_percentage: number
    } | null
}

export default function HRApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchApplications()
    }, [])

    const fetchApplications = async () => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<Application[]>('/api/applications')
            setApplications(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('newest')

    const filteredApplications = applications.filter(app => {
        const matchesSearch =
            app.candidate.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.job.title.toLowerCase().includes(searchTerm.toLowerCase())

        let matchesStatus = statusFilter === 'all' || app.status === statusFilter

        // Handle rejected status variants
        if (statusFilter === 'rejected') {
            matchesStatus = app.status === 'rejected' || app.status === 'rejected_post_interview'
        }

        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
        if (sortBy === 'oldest') return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
        if (sortBy === 'score_desc') return (b.resume_extraction?.resume_score || 0) - (a.resume_extraction?.resume_score || 0)
        if (sortBy === 'score_asc') return (a.resume_extraction?.resume_score || 0) - (b.resume_extraction?.resume_score || 0)
        return 0
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'submitted': return 'bg-blue-100 text-blue-800'
            case 'approved_for_interview': return 'bg-indigo-100 text-indigo-800'
            case 'interview_completed': return 'bg-purple-100 text-purple-800'
            case 'hired': return 'bg-green-100 text-green-800'
            case 'rejected':
            case 'rejected_post_interview': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications</h1>
            <p className="text-gray-600 mb-8">Review and manage candidate applications.</p>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search candidate or job..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="score_desc">Highest Match Score</option>
                        <option value="score_asc">Lowest Match Score</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">No applications match your filtering criteria.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredApplications.map((app) => (
                        <Link href={`/dashboard/hr/applications/${app.id}`} key={app.id}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{app.candidate.full_name}</h3>
                                        <p className="text-gray-600">Applied for <span className="font-medium text-gray-900">{app.job.title}</span></p>
                                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                            <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                                            {app.resume_extraction && (
                                                <>
                                                    <span className="text-green-600 font-medium">Match: {app.resume_extraction.skill_match_percentage}%</span>
                                                    <span className="text-blue-600 font-medium">Score: {app.resume_extraction.resume_score}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                            {app.status.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                        <span className="text-blue-600 text-sm hover:underline">View Details →</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
