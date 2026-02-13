'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { APIClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

// Correctly typing params as a Promise for Next.js 15+
interface PageProps {
    params: Promise<{ id: string }>
}

export default function HREditJobPage({ params }: PageProps) {
    const router = useRouter()
    const { user } = useAuth()
    
    // Unwrap params using React.use() or await in useEffect (since this is client component)
    // For simplicity in client components with async params in Next.js 15:
    const [jobId, setJobId] = useState<string | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_skills: '',
        experience_level: 'junior',
        status: 'open'
    })

    useEffect(() => {
        // Unwrap params
        params.then(unwrappedParams => {
            setJobId(unwrappedParams.id)
            fetchJobDetails(unwrappedParams.id)
        })
    }, [params])

    const fetchJobDetails = async (id: string) => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<any>(`/api/jobs/${id}`)
            setFormData({
                title: data.title,
                description: data.description,
                required_skills: data.required_skills,
                experience_level: data.experience_level,
                status: data.status
            })
        } catch (err) {
            setError('Failed to fetch job details')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!jobId) return
        
        setError('')
        setIsSubmitting(true)

        try {
            await APIClient.put(`/api/jobs/${jobId}`, formData)
            router.push('/dashboard/hr/jobs')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update job')
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Link href="/dashboard/hr/jobs" className="flex items-center text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors w-fit">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Job Listings
            </Link>

            <Card className="border-border backdrop-blur-md bg-card/70 shadow-xl rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 ">
                        Edit Job Position
                    </CardTitle>
                    <CardDescription>
                        Update the role requirements and details.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-200 ">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
                                Job Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background/50"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="experience" className="block text-sm font-medium text-foreground mb-1">
                                    Experience Level
                                </label>
                                <select
                                    id="experience"
                                    className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background/50"
                                    value={formData.experience_level}
                                    onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
                                >
                                    <option value="intern">Intern</option>
                                    <option value="junior">Junior (0-2 years)</option>
                                    <option value="mid">Mid-Level (3-5 years)</option>
                                    <option value="senior">Senior (5+ years)</option>
                                    <option value="lead">Lead / Manager</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background/50"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="open">Open</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-foreground mb-1">
                                Required Skills (Comma separated)
                            </label>
                            <input
                                id="skills"
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background/50"
                                value={formData.required_skills}
                                onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                                Job Description
                            </label>
                            <textarea
                                id="description"
                                required
                                rows={6}
                                className="w-full px-4 py-2 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background/50"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/dashboard/hr/jobs">
                                <Button type="button" variant="outline" className="rounded-full">Cancel</Button>
                            </Link>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px] rounded-full"
                                disabled={isSubmitting}
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
