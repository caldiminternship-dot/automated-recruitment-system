'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIClient } from '@/lib/api-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Interview {
    id: number
    status: string
    created_at: string
    job_id: number
    job_title: string
    locked_skill: string
    score: number | null
}

export default function CandidateInterviewsPage() {
    const router = useRouter()
    const [interviews, setInterviews] = useState<Interview[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filter State
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('newest')

    useEffect(() => {
        fetchInterviews()
    }, [])

    const fetchInterviews = async () => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<Interview[]>('/api/interviews/my-interviews')
            setInterviews(data)
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredInterviews = interviews.filter(interview => {
        const matchesSearch = interview.job_title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || interview.status === statusFilter
        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'score_desc') return (b.score || 0) - (a.score || 0)
        return 0
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'completed': return 'bg-purple-100 text-purple-800'
            case 'in_progress': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Interviews</h1>
            <p className="text-gray-600 mb-8">Manage and review your AI interviews.</p>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by job title..."
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
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="score_desc">Highest Score</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No interviews found</h3>
                    <p className="text-gray-500 mb-6">Your scheduled or completed interviews will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredInterviews.map((interview) => (
                        <Card key={interview.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-xl">{interview.job_title}</CardTitle>
                                    <CardDescription>
                                        Date: {new Date(interview.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                                    {interview.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                                    <div>
                                        <span className="font-semibold">Locked Skill:</span> {interview.locked_skill}
                                    </div>
                                    {interview.score !== null && (
                                        <div className="text-blue-600 font-medium">
                                            Score: {interview.score}/10
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    {interview.status === 'pending' || interview.status === 'in_progress' ? (
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => router.push(`/interview/${interview.id}`)}
                                        >
                                            {interview.status === 'pending' ? 'Start Interview' : 'Resume Interview'}
                                        </Button>
                                    ) : (
                                        <div className="w-full bg-gray-50 border border-gray-200 rounded-md p-3 text-center text-sm text-gray-500">
                                            Interview Completed
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
