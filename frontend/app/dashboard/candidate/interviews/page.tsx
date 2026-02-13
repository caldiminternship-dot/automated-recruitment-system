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
            case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 border'
            case 'completed': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 border'
            case 'in_progress': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 border'
            default: return 'bg-muted text-muted-foreground border-border border'
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Interviews</h1>
            <p className="text-muted-foreground mb-8">Manage and review your AI interviews.</p>

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
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>

                    <select
                        className="px-3 py-2 border border-input rounded-md text-sm focus:ring-2 focus:ring-primary outline-none bg-background text-foreground"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                </div>
            ) : filteredInterviews.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <h3 className="text-lg font-medium text-foreground mb-2">No interviews found</h3>
                    <p className="text-muted-foreground mb-6">Your scheduled or completed interviews will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredInterviews.map((interview, index) => (
                        <Card key={interview.id} style={{ animationDelay: `${index * 100}ms` }} className="hover:shadow-lg transition-all duration-300 bg-card border-border backdrop-blur-sm group animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">{interview.job_title}</CardTitle>
                                    <CardDescription className="text-muted-foreground">
                                        Date: {new Date(interview.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)} shadow-sm`}>
                                    {interview.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4 bg-muted/30 p-3 rounded-lg border border-border">
                                    <div>
                                        <span className="font-semibold text-foreground">Locked Skill:</span> {interview.locked_skill}
                                    </div>
                                    {interview.score !== null && (
                                        <div className="text-primary font-bold bg-primary/10 px-2 py-1 rounded border border-primary/20">
                                            Score: {interview.score}/10
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4">
                                    {interview.status === 'pending' || interview.status === 'in_progress' ? (
                                        <Button
                                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                                            onClick={() => router.push(`/interview/${interview.id}`)}
                                        >
                                            {interview.status === 'pending' ? 'Start Interview' : 'Resume Interview'}
                                        </Button>
                                    ) : (
                                        <div className="w-full bg-muted border border-border rounded-md p-3 text-center text-sm text-muted-foreground font-medium">
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
