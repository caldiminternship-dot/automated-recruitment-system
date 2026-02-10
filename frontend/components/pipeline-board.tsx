"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Application = {
    id: number
    job_title: string
    candidate: {
        full_name: string
        email: string
    }
    status: string
    skill_match_percentage?: number
    resume_score?: number
}

const STATUS_COLUMNS = [
    { id: "submitted", label: "Applied", color: "bg-blue-100 text-blue-800" },
    { id: "approved_for_interview", label: "Interview", color: "bg-yellow-100 text-yellow-800" },
    { id: "hired", label: "Hired", color: "bg-green-100 text-green-800" },
    { id: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
]

export function PipelineBoard() {
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(true)

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const token = localStorage.getItem("auth_token")
                console.log("Checking token:", token ? "Token exists" : "No token")

                if (!token) {
                    setError("No authentication token found. Please log in.")
                    setLoading(false)
                    return
                }

                console.log("Fetching applications...")

                const res = await fetch("http://127.0.0.1:8000/api/applications", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                console.log("Response status:", res.status)

                if (res.ok) {
                    const data = await res.json()
                    console.log("Applications data:", data)

                    if (data.length === 0) {
                        setError("No applications found. You might be logged in as a candidate or an HR user with no jobs.")
                    } else {
                        const transformed = data.map((app: any) => ({
                            id: app.id,
                            job_title: app.job.title,
                            candidate: app.candidate,
                            status: app.status,
                            skill_match_percentage: app.resume_extraction?.skill_match_percentage,
                            resume_score: app.resume_extraction?.resume_score
                        }))
                        setApplications(transformed)
                        setError(null)
                    }
                } else {
                    const errorText = await res.text()
                    console.error("API Error:", res.status, errorText)
                    setError(`Failed to fetch applications. Status: ${res.status}`)
                }
            } catch (error) {
                console.error("Failed to fetch applications", error)
                setError("Network error or backend is not reachable.")
            } finally {
                setLoading(false)
            }
        }

        fetchApplications()
    }, [])

    if (loading) {
        return <div>Loading pipeline...</div>
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
                <h3 className="font-bold">Status</h3>
                <p>{error}</p>
                <div className="mt-2 text-sm text-gray-700">
                    <p>Debugging Check:</p>
                    <ul className="list-disc pl-5">
                        <li>Ensure you are logged in as <strong>hr@example.com</strong> (Password: password123)</li>
                        <li>Applications are only visible to the HR user who posted the job.</li>
                    </ul>
                </div>
            </div>
        )
    }

    const getColumnApplications = (status: string) => {
        if (status === "rejected") {
            return applications.filter(app => app.status === "rejected" || app.status === "rejected_post_interview")
        }
        return applications.filter(app => app.status === status)
    }

    return (
        <div className="flex h-full gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((column) => (
                <div key={column.id} className="min-w-[300px] w-[300px] flex flex-col bg-muted/50 rounded-lg p-2">
                    <div className="flex items-center justify-between p-2 mb-2">
                        <h3 className="font-semibold text-sm">{column.label}</h3>
                        <Badge variant="secondary" className="text-xs">
                            {getColumnApplications(column.id).length}
                        </Badge>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="space-y-2 p-1">
                            {getColumnApplications(column.id).map((app) => (
                                <Card key={app.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex items-center space-x-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{app.candidate.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <CardTitle className="text-sm font-medium">{app.candidate.full_name}</CardTitle>
                                                <CardDescription className="text-xs truncate" title={app.job_title}>
                                                    {app.job_title}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {app.skill_match_percentage && (
                                                <Badge variant={app.skill_match_percentage > 80 ? "default" : "outline"} className="text-[10px] px-1 py-0 h-5">
                                                    Match: {Math.round(app.skill_match_percentage)}%
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            ))}
        </div>
    )
}
