'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { APIClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog"



export default function HRApplicationDetailPage() {
    const params = useParams()
    const router = useRouter()
    const applicationId = params.id as string

    const [application, setApplication] = useState<any>(null)
    const [interviewReport, setInterviewReport] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
            case 'rejected': return 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
            case 'interview_scheduled':
            case 'approved_for_interview': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
            case 'interview_completed': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            default: return 'bg-gray-100 dark:bg-secondary text-gray-800 dark:text-foreground border-gray-200 dark:border-border'
        }
    }

    const getStatusLabel = (status: string) => {
        return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || status
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setIsLoading(true)
            const appData = await APIClient.get<any>(`/api/applications/${applicationId}`)
            setApplication(appData)

            // Try to load interview report if interview exists
            if (appData.interview && appData.interview.status === 'completed') {
                try {
                    const reportData = await APIClient.get<any>(`/api/interviews/${appData.interview.id}/report`)
                    setInterviewReport(reportData)
                } catch (e) {
                    // Report not generated yet
                }
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const updateStatus = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to update status to: ${newStatus}?`)) return

        setIsUpdating(true)
        try {
            await APIClient.put(`/api/applications/${applicationId}/status`, {
                status: newStatus,
                hr_notes: `Status updated to ${newStatus} by HR`
            })
            loadData() // Reload
        } catch (err) {
            alert('Failed to update status')
        } finally {
            setIsUpdating(false)
        }
    }

    const makeDecision = async (decision: 'rejected' | 'hired') => {
        if (!confirm(`Final Decision: ${decision.toUpperCase()}. This action is permanent.`)) return

        setIsUpdating(true)
        try {
            await APIClient.put(`/api/decisions/applications/${applicationId}/decide`, {
                decision,
                decision_comments: `Manual decision by HR: ${decision}`
            })
            router.push('/dashboard/hr/applications')
        } catch (err) {
            alert('Failed to record decision')
        } finally {
            setIsUpdating(false)
        }
    }

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading details...</div>
    if (!application) return <div className="p-8 text-center text-destructive">Application not found</div>

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-start animate-in fade-in slide-in-from-top-4 duration-700 ease-out fill-mode-both">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{application.candidate.full_name}</h1>
                    <p className="text-muted-foreground">{application.candidate.email}</p>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Applying for <span className="font-semibold text-foreground">{application.job.title}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {getStatusLabel(application.status)}
                    </span>
                    <div className="flex gap-2">
                        {application.status === 'submitted' && (
                            <>
                                <Button
                                    onClick={() => updateStatus('approved_for_interview')}
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={isUpdating}
                                >
                                    Approve for Interview
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => updateStatus('rejected')}
                                    disabled={isUpdating}
                                >
                                    Reject Application
                                </Button>
                            </>
                        )}

                        {(application.status === 'interview_completed' || application.status === 'approved_for_interview') && (
                            <div className="flex gap-2">
                                <Button
                                    className="bg-green-600"
                                    onClick={() => makeDecision('hired')}
                                    disabled={isUpdating}
                                >
                                    HIRE CANDIDATE
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => makeDecision('rejected')}
                                    disabled={isUpdating}
                                >
                                    REJECT
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Resume Analysis */}
                <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both delay-100">
                    <CardHeader>
                        <CardTitle>AI Resume Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {application.resume_extraction ? (
                            <>
                                <div className="flex justify-between text-sm border-b border-border pb-2">
                                    <span className="text-muted-foreground">Match Score</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{application.resume_extraction.skill_match_percentage}%</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Extracted Skills</h4>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {application.resume_extraction.extracted_skills || 'None detected'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Summary</h4>
                                    <div className="text-sm text-muted-foreground italic">
                                        "{application.resume_extraction.extracted_text?.slice(0, 100)}
                                        {application.resume_extraction.extracted_text?.length > 100 ? '...' : ''}"

                                        {application.resume_extraction.extracted_text?.length > 100 && (
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <span className="text-primary cursor-pointer ml-2 font-medium hover:underline text-xs bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                        Read more
                                                    </span>
                                                </DialogTrigger>
                                                <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-sm border-border shadow-xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-xl font-bold text-primary flex items-center gap-2">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            Professional Summary
                                                        </DialogTitle>
                                                        <DialogDescription className="text-sm text-muted-foreground">
                                                            Detailed analysis of the candidate's profile based on their resume.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="mt-4 text-foreground leading-relaxed text-base p-4 bg-muted/30 rounded-lg border border-border">
                                                        {application.resume_extraction.extracted_text}
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-yellow-600 text-sm">Resume parsing pending or failed.</p>
                        )}
                        {application.resume_file_path ? (
                            <div className="pt-4">
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_BASE_URL}/${application.resume_file_path.replace(/\\/g, '/')}`}
                                    target="_blank"
                                    className="text-primary hover:underline text-sm font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Download Original Resume
                                </a>
                            </div>
                        ) : (
                            <div className="pt-4 flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 p-3 rounded-md">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span className="text-sm font-medium">No resume file found for this application.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Interview Results */}
                <Card className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both delay-200">
                    <CardHeader>
                        <CardTitle>AI Interview Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {interviewReport ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-muted/50 p-3 rounded">
                                    <span className="font-medium">Overall Score</span>
                                    <span className="text-2xl font-bold text-primary">{interviewReport.overall_score.toFixed(1)}/10</span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Technical Skills</span>
                                        <span className="font-medium">{interviewReport.technical_skills_score}/10</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Communication</span>
                                        <span className="font-medium">{interviewReport.communication_score}/10</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-1">Recommendation</h4>
                                    <div className={`text-sm font-bold uppercase ${interviewReport.recommendation.includes('hire') ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                                        }`}>
                                        {interviewReport.recommendation.replace(/_/g, ' ')}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-1">AI Summary</h4>
                                    <p className="text-sm text-muted-foreground">{interviewReport.summary}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {application.status === 'interview_completed'
                                    ? 'Generating report...'
                                    : 'Interview not yet completed'}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
