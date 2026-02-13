'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { APIClient } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HRCreateJobPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_skills: '',
        experience_level: 'junior'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            await APIClient.post('/api/jobs', formData)
            router.push('/dashboard/hr/jobs')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create job')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Link href="/dashboard/hr/jobs" className="text-muted-foreground hover:text-foreground text-sm mb-6 inline-block">
                ← Back to Job Listings
            </Link>

            <Card className="border-border backdrop-blur-md bg-card/70 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 ">
                        Create New Job Position
                    </CardTitle>
                    <CardDescription>
                        Define the role requirements. The AI will use this information to generate interview questions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200 ">
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
                                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                placeholder="e.g. Senior Frontend Engineer"
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
                                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
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
                        </div>

                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-foreground mb-1">
                                Required Skills (Comma separated)
                            </label>
                            <input
                                id="skills"
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                placeholder="e.g. React, TypeScript, Python, AWS"
                                value={formData.required_skills}
                                onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground mt-1">AI will focus questions on these key skills.</p>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                                Job Description
                            </label>
                            <textarea
                                id="description"
                                required
                                rows={6}
                                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                                placeholder="Describe the role responsibilities, team culture, and key expectations..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Link href="/dashboard/hr/jobs">
                                <Button type="button" variant="outline">Cancel</Button>
                            </Link>
                            <Button
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[150px]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Creating...' : 'Post Job'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
