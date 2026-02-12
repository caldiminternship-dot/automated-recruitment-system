'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { APIClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock } from 'lucide-react'

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
        <div className="p-8 max-w-7xl mx-auto z-10 relative">
            
            {/* Filter Toolbar - Light Glassmorphism */} 
            <div className="bg-card/80 backdrop-blur-md border border-border p-4 rounded-xl shadow-sm mb-8 flex flex-wrap gap-4 items-center justify-between transition-all hover:shadow-md">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative group">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors group-focus-within:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by title or skill..."
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm text-foreground placeholder-muted-foreground transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <select
                        className="px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                    >
                        <option value="all">All Levels</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-Level</option>
                        <option value="senior">Senior</option>
                    </select>

                    <select
                        className="px-4 py-2.5 bg-background border border-input rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer hover:bg-muted/50 transition-colors shadow-sm"
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-2xl border border-border">
                    <p className="text-muted-foreground text-lg">No open positions match your search.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <Card key={job.id} className={`group hover:-translate-y-1 transition-all duration-300 border backdrop-blur-md shadow-sm hover:shadow-xl ${
                            job.is_applied 
                            ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900 opacity-90' 
                            : 'bg-gradient-to-br from-card to-indigo-50/40 dark:to-indigo-950/20 border-border hover:to-indigo-50/60 dark:hover:to-indigo-900/30 hover:border-indigo-200/50 dark:hover:border-indigo-800/50'
                        }`}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <CardTitle className="text-xl text-foreground font-bold leading-tight group-hover:text-primary transition-colors">
                                        {job.title}
                                    </CardTitle>
                                    {job.is_applied && (
                                        <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                            Applied
                                        </span>
                                    )}
                                </div>
                                <CardDescription className="flex flex-wrap gap-2 mt-3">
                                    <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                        {job.experience_level.replace('_', ' ').toUpperCase()}
                                    </span>
                                    {!job.is_applied && (
                                        <span className="bg-blue-50 text-blue-600 border border-blue-100 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                            {job.status.toUpperCase()}
                                        </span>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm line-clamp-3 mb-5 leading-relaxed">
                                    {job.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {job.required_skills.split(',').slice(0, 3).map((skill, i) => (
                                        <span key={i} className="text-xs bg-muted/50 text-muted-foreground px-2.5 py-1 rounded-md border border-border">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                    {job.required_skills.split(',').length > 3 && (
                                        <span className="text-xs text-slate-400 px-2 py-1">+more</span>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Button
                                        className={`w-full font-medium shadow-md transition-all ${
                                            job.is_applied 
                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-default border border-emerald-200' 
                                            : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/20 hover:shadow-indigo-500/30'
                                        }`}
                                        onClick={() => !job.is_applied && handleApplyClick(job.id)}
                                        disabled={job.is_applied}
                                    >
                                        {job.is_applied ? 'Application Sent' : 'Apply Now'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full bg-transparent border-input text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all"
                                        onClick={() => setViewJob(job)}
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Application Dialog */}
            <Dialog open={!!selectedJobId} onOpenChange={(open) => !open && setSelectedJobId(null)}>
                <DialogContent className="sm:max-w-md bg-card border border-border shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Apply for Job</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Upload your resume to apply for this position.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitApplication}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="resume" className="text-foreground">Resume (PDF/DOCX)</Label>
                                <Input
                                    id="resume"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    required
                                    className="bg-muted/50 border-input text-foreground file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:mr-4 file:px-2 file:py-1 hover:file:bg-primary/20"
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/30 p-2 rounded border border-red-100 dark:border-red-900/50">{error}</p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelectedJobId(null)}
                                disabled={isApplying}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isApplying || !resumeFile}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
                <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border border-border text-foreground max-h-[90vh] overflow-y-auto shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{viewJob?.title}</DialogTitle>
                        <DialogDescription className="text-base mt-2 flex gap-2 items-center">
                            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded text-xs border border-indigo-100 dark:border-indigo-800">
                                {viewJob?.experience_level.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="text-muted-foreground">{viewJob?.status.toUpperCase()}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-6 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out fill-mode-both delay-150">
                        <div>
                            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Job Description</h4>
                            <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm bg-muted/30 p-4 rounded-lg border border-border">
                                {viewJob?.description}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Required Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {viewJob?.required_skills.split(',').map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-card text-foreground rounded-md text-sm border border-border shadow-sm">
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground pt-4 border-t border-border flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Posted on {viewJob ? new Date(viewJob.created_at).toLocaleDateString() : ''}
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0 pt-2 border-t border-border">
                        <Button variant="ghost" onClick={() => setViewJob(null)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                            Close
                        </Button>
                        {!viewJob?.is_applied && (
                            <Button 
                                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20"
                                onClick={() => {
                                    if (viewJob) {
                                        handleApplyClick(viewJob.id)
                                        setViewJob(null)
                                    }
                                }}
                            >
                                Apply for this Position
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
