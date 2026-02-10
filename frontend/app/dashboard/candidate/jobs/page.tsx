'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

    interface Job {
    id: number
    title: string
    description: string
    required_skills: string
    experience_level: string
    status: string
    created_at: string
    is_applied: boolean
}

export default function CandidateJobsPage() {
    const router = useRouter()
    const [jobs, setJobs] = useState<Job[]>([])
    const [error, setError] = useState('')
    const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
    const [viewJob, setViewJob] = useState<Job | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Application Form State
    const [isApplying, setIsApplying] = useState(false)
    const [resumeFile, setResumeFile] = useState<File | null>(null)

    useEffect(() => {
        fetchJobs()
    }, [])

    const fetchJobs = async () => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<Job[]>('/api/jobs')
            
            // Sort applied jobs to the end
            const sortedData = data.sort((a, b) => {
                if (a.is_applied === b.is_applied) return 0;
                return a.is_applied ? 1 : -1;
            });
            
            setJobs(sortedData)
        } catch (err) {
            setError('Failed to load job postings')
        } finally {
            setIsLoading(false)
        }
    }



    const handleApplyClick = (jobId: number) => {
        setSelectedJobId(jobId)
        setResumeFile(null)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setResumeFile(e.target.files[0])
        }
    }

    const handleSubmitApplication = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedJobId || !resumeFile) return

        setIsApplying(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('resume_file', resumeFile)

            await APIClient.postMultipart(`/api/applications/apply?job_id=${selectedJobId}`, formData)

            alert('Application submitted successfully! Redirecting to applications...')
            router.push('/dashboard/candidate/applications')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit application')
        } finally {
            setIsApplying(false)
        }
    }

    // Filter Logic
    const [searchTerm, setSearchTerm] = useState('')
    const [levelFilter, setLevelFilter] = useState('all')
    const [sortBy, setSortBy] = useState('newest')

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.required_skills.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesLevel = levelFilter === 'all' || job.experience_level === levelFilter

        return matchesSearch && matchesLevel && job.status === 'open'
    }).sort((a, b) => {
        // Primary sort: Application status (unapplied first)
        if (a.is_applied !== b.is_applied) {
            return a.is_applied ? 1 : -1;
        }

        // Secondary sort: Selected criteria
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        return 0
    })

    // ... (render selected job view)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* ... (header and filters) */}
            
            {/* Filter Toolbar content remains same... */} 
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by title or skill..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                    >
                        <option value="all">All Levels</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-Level</option>
                        <option value="senior">Senior</option>
                    </select>

                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">No open positions match your search.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className={`hover:shadow-lg transition-all duration-200 border-gray-200 bg-white ${job.is_applied ? 'opacity-75 bg-gray-50' : ''}`}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-xl text-gray-900">{job.title}</CardTitle>
                                    {job.is_applied && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                            Applied
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="flex gap-2 mt-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                        {job.experience_level.replace('_', ' ').toUpperCase()}
                                    </span>
                                    {!job.is_applied && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                            {job.status.toUpperCase()}
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4 h-15">
                                    {job.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mb-6">
                                    {job.required_skills.split(',').slice(0, 3).map((skill, i) => (
                                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                    {job.required_skills.split(',').length > 3 && (
                                        <span className="text-xs text-gray-400 px-2 py-1">+more</span>
                                    )}
                                </div>
                                <Button
                                    className={`w-full ${job.is_applied ? 'bg-green-600 hover:bg-green-700 cursor-default' : 'bg-slate-900 hover:bg-slate-800'} text-white`}
                                    onClick={() => !job.is_applied && handleApplyClick(job.id)}
                                    disabled={job.is_applied}
                                >
                                    {job.is_applied ? 'Applied' : 'Apply Now'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => setViewJob(job)}
                                >
                                    View Details
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            {/* Application Dialog */}
            <Dialog open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>Apply for Job</DialogTitle>
                        <DialogDescription>
                            Upload your resume to apply for this position.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitApplication}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="resume">Resume (PDF/DOCX)</Label>
                                <Input
                                    id="resume"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-500 font-medium">{error}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedJobId(null)}
                                disabled={isApplying}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isApplying || !resumeFile}>
                                {isApplying ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Job Details Dialog */}
            <Dialog open={!!viewJob} onOpenChange={(open) => !open && setViewJob(null)}>
                <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{viewJob?.title}</DialogTitle>
                        <DialogDescription className="text-base mt-2">
                            {viewJob?.experience_level.replace('_', ' ').toUpperCase()} • {viewJob?.status.toUpperCase()}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h4>
                            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {viewJob?.description}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {viewJob?.required_skills.split(',').map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 pt-4 border-t">
                            Posted on {viewJob ? new Date(viewJob.created_at).toLocaleDateString() : ''}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setViewJob(null)}>
                            Close
                        </Button>
                        {!viewJob?.is_applied && (
                            <Button 
                                className="bg-slate-900 text-white hover:bg-slate-800"
                                onClick={() => {
                                    if (viewJob) {
                                        handleApplyClick(viewJob.id)
                                        setViewJob(null)
                                    }
                                }}
                            >
                                Apply Now
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
