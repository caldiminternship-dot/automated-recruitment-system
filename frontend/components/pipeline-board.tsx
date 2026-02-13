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
        <div className="flex h-full gap-6 overflow-x-auto pb-4 px-2">
            {STATUS_COLUMNS.map((column, colIndex) => (
                <div key={column.id} style={{ animationDelay: `${colIndex * 150}ms` }} className="min-w-[320px] w-[320px] h-full max-h-full flex flex-col bg-muted/30 backdrop-blur-sm rounded-xl border border-border/60 p-3 shadow-inner overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
                    <div className="flex items-center justify-between p-2 mb-3 shrink-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">{column.label}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-background text-muted-foreground shadow-sm border border-border">
                            {getColumnApplications(column.id).length}
                        </Badge>
                    </div>

                    <ScrollArea className="flex-1 min-h-0 pr-2">
                        <div className="space-y-3 p-1">
                            {getColumnApplications(column.id).map((app, index) => (
                                <Card key={app.id} style={{ animationDelay: `${index * 100}ms` }} className="cursor-pointer hover:shadow-lg transition-all duration-300 bg-card/50 hover:bg-card backdrop-blur-md border-border/50 group hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                                    <CardHeader className="p-3 pb-1">
                                        <div className="flex items-center space-x-2.5">
                                            <Avatar className="h-8 w-8 border-2 border-background shadow-sm shrink-0">
                                                <AvatarFallback className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-primary font-bold text-xs">
                                                    {app.candidate.full_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden min-w-0">
                                                <CardTitle className="text-sm font-bold text-foreground truncate leading-tight">{app.candidate.full_name}</CardTitle>
                                                <CardDescription className="text-[11px] truncate text-muted-foreground font-medium leading-tight mt-0.5" title={app.job_title}>
                                                    {app.job_title}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-1">
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {app.skill_match_percentage && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-1.5 py-0 h-5 border ${app.skill_match_percentage > 80
                                                            ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                                                        }`}
                                                >
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
