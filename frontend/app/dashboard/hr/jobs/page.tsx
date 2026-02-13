'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { APIClient } from '@/lib/api-client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit2 } from 'lucide-react'

interface Job {
    id: number
    title: string
    description: string
    required_skills: string
    experience_level: string
    status: string
    created_at: string
}

export default function HRJobsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<Job[]>('/api/jobs')
            setJobs(data)
        } catch (err) {
            setError('Failed to load job postings')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = async (jobId: number) => {
        if (!confirm('Are you sure you want to close this job? Applications will be retained.')) return

        try {
            await APIClient.put(`/api/jobs/${jobId}`, { status: 'closed' })
            fetchJobs() // Reload
        } catch (err) {
            console.error("Close Error:", err)
            alert('Failed to close job')
        }
    }

    const handleDelete = async (jobId: number) => {
        if (!confirm('Are you sure you want to DELETE this job? All applications will be permanently removed.')) return

        try {
            await APIClient.delete(`/api/jobs/${jobId}`)
            fetchJobs() // Reload
        } catch (err) {
            console.error("Delete Error:", err)
            alert('Failed to delete job')
        }
    }

    // Filter Logic
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all') // 'all', 'open', 'closed'
    const [sortBy, setSortBy] = useState('newest')

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter
        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return 0
    })

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Job Postings</h1>
                    <p className="text-muted-foreground mt-2">Manage your active job listings</p>
                </div>
                <Link href="/dashboard/hr/jobs/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create New Job</Button>
                </Link>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-card/50 p-4 rounded-lg border border-border shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700 ease-out">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search jobs..."
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
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
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

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 ">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-card/50 rounded-xl border border-border shadow-sm">
                    <div className="mb-4 text-muted-foreground">
                        <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No jobs match your filters</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">Try adjusting your search criteria or create a new job.</p>
                    <Link href="/dashboard/hr/jobs/create">
                        <Button variant="outline">Create Job</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredJobs.map((job, index) => (
                        <Card 
                            key={job.id} 
                            style={{ animationDelay: `${index * 150}ms` }}
                            className="hover:shadow-lg transition-all duration-300 bg-card/50 border-border backdrop-blur-sm group hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both"
                        >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div>
                                    <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1 text-muted-foreground">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-muted text-muted-foreground'
                                            }`}>
                                            {job.status.toUpperCase()}
                                        </span>
                                        <span className="text-muted-foreground/30">•</span>
                                        <span>{job.experience_level.replace('_', ' ')}</span>
                                        <span className="text-muted-foreground/30">•</span>
                                        <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {job.status === 'open' && (
                                        <>
                                            <Link href={`/dashboard/hr/jobs/${job.id}/edit`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:text-primary/90 hover:bg-primary/10 h-8 px-2"
                                                >
                                                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200 "
                                                onClick={() => handleClose(job.id)}
                                            >
                                                Close
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                                        onClick={() => handleDelete(job.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Description</h4>
                                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{job.description}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Required Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {job.required_skills.split(',').map((skill, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-muted/50 border border-border text-foreground rounded-md text-xs shadow-sm font-medium">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
