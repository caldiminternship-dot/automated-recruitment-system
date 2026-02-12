'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { APIClient } from '@/lib/api-client'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'
import { Download, FileText, Filter, Search, AlertCircle, CheckCircle2, XCircle, ChevronDown, RotateCcw } from 'lucide-react'


// Constants
const SKILL_CATEGORIES = [
    "backend", "frontend", "fullstack", "devops", "networking",
    "data", "mobile", "aec_bim", "hr", "qa_testing", "ui_ux", "cybersecurity"
]

// Types
interface Evaluation {
    overall: number
    technical_accuracy?: number
    completeness?: number
    clarity?: number
    depth?: number
    practicality?: number
    strengths?: string[]
    weaknesses?: string[]
}

interface QuestionEvaluation {
    question: string
    answer: string
    evaluation: Evaluation
}

interface CandidateProfile {
    experience_level?: string
    primary_skill?: string
    confidence?: string
    communication?: string
    intro_score?: number
    skills?: string[]
}

interface Report {
    filename: string
    timestamp: string
    display_date: string
    display_date_short: string
    status: string
    status_color: string
    overall_score: number
    final_score: number
    total_questions_answered: number
    question_evaluations: QuestionEvaluation[]
    candidate_profile: CandidateProfile
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionEvaluation | null>(null)

    // Filters
    const [statusFilter, setStatusFilter] = useState('All')
    const [skillFilter, setSkillFilter] = useState('All') // New
    const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined) // New
    const [scoreRange, setScoreRange] = useState([0, 10])
    const [experienceFilter, setExperienceFilter] = useState('All')
    const [selectedSkills, setSelectedSkills] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    // Derived Data for Filters
    const uniqueExperiences = useMemo(() => Array.from(new Set(reports.map(r => r.candidate_profile.experience_level || 'N/A'))).sort(), [reports])
    const uniqueSkills = useMemo(() => Array.from(new Set(reports.map(r => r.candidate_profile.primary_skill || 'N/A'))).sort(), [reports])

    // Derived Interview Counts for Calendar Heatmap
    const interviewCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        reports.forEach(r => {
            const date = new Date(r.timestamp)
            if (!isNaN(date.getTime())) {
                const dateStr = date.toDateString()
                counts[dateStr] = (counts[dateStr] || 0) + 1
            }
        })
        return counts
    }, [reports])

    useEffect(() => {
        fetchReports()
    }, [])

    const fetchReports = async () => {
        try {
            setIsLoading(true)
            const data = await APIClient.get<Report[]>('/api/analytics/reports')
            setReports(data)
        } catch (err) {
            setError('Failed to load reports. Please try again.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Filter Logic
    const filteredReports = useMemo(() => {
        return reports.filter(report => {
            const matchesStatus = statusFilter === 'All' || report.status === statusFilter
            const matchesScore = report.overall_score >= scoreRange[0] && report.overall_score <= scoreRange[1]
            const matchesExp = experienceFilter === 'All' || report.candidate_profile.experience_level === experienceFilter
            
            // Skill Filter Logic (Partial Match)
            const matchesSkillFilter = skillFilter === 'All' || 
                (report.candidate_profile.primary_skill?.toLowerCase() || '').includes(skillFilter.toLowerCase()) ||
                (report.candidate_profile.skills?.some(s => s.toLowerCase().includes(skillFilter.toLowerCase())) || false)

            // Date Filter Logic
            const reportDate = new Date(report.timestamp)
            const matchesDate = !dateFilter || (
                reportDate.getDate() === dateFilter.getDate() &&
                reportDate.getMonth() === dateFilter.getMonth() &&
                reportDate.getFullYear() === dateFilter.getFullYear()
            )

            // Basic search
            const matchesSearch = searchQuery === '' ||
                report.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (report.candidate_profile.primary_skill || '').toLowerCase().includes(searchQuery.toLowerCase())

            return matchesStatus && matchesScore && matchesExp && matchesSearch && matchesSkillFilter && matchesDate
        })
    }, [reports, statusFilter, scoreRange, experienceFilter, skillFilter, dateFilter, searchQuery])

    // Metrics
    const metrics = useMemo(() => {
        const total = filteredReports.length
        const selected = filteredReports.filter(r => r.status === 'Selected').length
        const conditional = filteredReports.filter(r => r.status === 'Conditional').length
        const rejected = filteredReports.filter(r => r.status === 'Rejected').length
        const avgScore = total > 0 ? (filteredReports.reduce((acc, r) => acc + r.overall_score, 0) / total).toFixed(2) : '0.00'
        const avgQuestions = total > 0 ? (filteredReports.reduce((acc, r) => acc + r.total_questions_answered, 0) / total).toFixed(1) : '0.0'

        return { total, selected, conditional, rejected, avgScore, avgQuestions }
    }, [filteredReports])

    // Generate Text Report
    const generateTextReport = (report: Report) => {
        let text = `============================================================\n`
        text += `VIRTUAL HR INTERVIEWER - CANDIDATE REPORT\n`
        text += `============================================================\n\n`

        text += `Report Generated: ${report.display_date}\n`
        text += `Total Questions: ${report.total_questions_answered}\n`
        text += `Overall Score: ${report.overall_score.toFixed(2)}/10\n`
        text += `Status: ${report.status}\n\n`

        text += `CANDIDATE PROFILE\n`
        text += `----------------------------------------\n`
        text += `Experience: ${report.candidate_profile.experience_level}\n`
        text += `Primary Skill: ${report.candidate_profile.primary_skill}\n`
        text += `Communication: ${report.candidate_profile.communication}\n`
        text += `Intro Score: ${report.candidate_profile.intro_score}/10\n\n`

        text += `QUESTION ANALYSIS\n`
        text += `----------------------------------------\n`
        report.question_evaluations.forEach((q, i) => {
            text += `\nQuestion ${i + 1}: ${q.question}\n`
            text += `Score: ${q.evaluation.overall}/10\n`
            if (q.evaluation.strengths) {
                text += `  Strengths:\n${q.evaluation.strengths.map(s => `    - ${s}`).join('\n')}\n`
            }
            if (q.evaluation.weaknesses) {
                text += `  Weaknesses:\n${q.evaluation.weaknesses.map(w => `    - ${w}`).join('\n')}\n`
            }
        })

        return text
    }

    const downloadCSV = () => {
        const headers = ['Candidate,Date,Primary Skill,Experience,Score,Status']
        const rows = filteredReports.map(r => [
            `"${r.filename.replace('.json', '')}"`,
            `"${r.display_date_short}"`,
            `"${r.candidate_profile.primary_skill || 'N/A'}"`,
            `"${r.candidate_profile.experience_level || 'N/A'}"`,
            `"${r.overall_score.toFixed(2)}"`,
            `"${r.status}"`
        ].join(','))

        const csvContent = [headers, ...rows].join('\n')
        downloadFile(csvContent, `interview_reports_${new Date().toISOString().split('T')[0]}.csv`, 'csv')
    }

    const downloadFile = (content: string, filename: string, type: 'json' | 'txt' | 'csv') => {
        let mimeType = 'text/plain'
        if (type === 'json') mimeType = 'application/json'
        if (type === 'csv') mimeType = 'text/csv'

        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const clearAllFilters = () => {
        setStatusFilter('All')
        setSkillFilter('All')
        setExperienceFilter('All')
        setScoreRange([0, 10])
        setSearchQuery('')
        setDateFilter(undefined)
        setSelectedSkills([])
    }

    // Helper for Category Score Cards
    const CategoryScoreCard = ({ title, score }: { title: string, score?: number }) => (
        <Card className="h-28 bg-card border shadow-sm">
            <CardContent className="h-full flex flex-col justify-center p-4">
                <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">{title}</div>
                <div className="text-3xl font-bold text-foreground">{score ? score.toFixed(1) : 'N/A'}<span className="text-base font-normal text-muted-foreground ml-1">/10</span></div>
            </CardContent>
        </Card>
    )

    // Chart Components
    const StatusChart = ({ data }: { data: { name: string, value: number, color: string }[] }) => (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )

    const ScoreDistributionChart = ({ report }: { report: Report }) => {
        const data = report.question_evaluations.map((q, i) => ({
            name: `Q${i + 1}`,
            score: q.evaluation.overall
        }))

        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" name="Score" />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    <h3 className="font-bold">Error Loading Reports</h3>
                    <p>{error}</p>
                    <Button onClick={fetchReports} variant="outline" className="mt-2">Retry</Button>
                </div>
            </div>
        )
    }

    return (
        /* 
          Main Layout Container
          - Uses flex-col to stack Header and Grid.
          - On desktop (lg), sets explicit height [100vh - 9rem] to fill remaining space
            (allowing for 4rem header + 4rem layout padding + 1rem safety).
          - 'min-h-0' is crucial for allowing flex children to scroll.
        */
        <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-6 lg:h-[calc(100vh-9rem)]">

            {/* Header - Fixed at the top of the component */}
            <div className="flex-none flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
                        Interview Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Analytics and detailed reports for {reports.length} candidates
                    </p>
                </div>
            </div>

            {/* Question Detail Modal */}
            <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
                <DialogContent className="w-full md:!max-w-[35vw] md:!w-[35vw] max-h-[90vh] overflow-y-auto bg-background/95 p-6">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Detailed Question Analysis</DialogTitle>
                        <DialogDescription>In-depth review of the candidate's response.</DialogDescription>
                    </DialogHeader>

                    {selectedQuestion && (
                        <div className="space-y-8 mt-4">
                            {/* Row 1: Question */}
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold text-foreground">Question:</h4>
                                <p className="text-lg text-foreground bg-card p-6 rounded-xl border shadow-sm leading-relaxed">
                                    {selectedQuestion.question}
                                </p>
                            </div>

                            {/* Row 2: Answer */}
                            <div className="space-y-2">
                                <h4 className="text-lg font-bold text-foreground">Answer:</h4>
                                <p className="text-base text-foreground bg-card p-6 rounded-xl border shadow-sm leading-relaxed whitespace-pre-wrap">
                                    {selectedQuestion.answer}
                                </p>
                            </div>

                            {/* Row 3: Category Scores */}
                            <div>
                                <h4 className="text-lg font-bold text-foreground mb-3">Category Scores:</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <CategoryScoreCard title="Technical Accuracy" score={selectedQuestion.evaluation.technical_accuracy} />
                                    <CategoryScoreCard title="Entirety" score={selectedQuestion.evaluation.completeness} />
                                    <CategoryScoreCard title="Clarity" score={selectedQuestion.evaluation.clarity} />
                                    <CategoryScoreCard title="Depth" score={selectedQuestion.evaluation.depth} />
                                    <CategoryScoreCard title="Practicality" score={selectedQuestion.evaluation.practicality} />
                                </div>
                            </div>

                            {/* Row 4: Overall Score */}
                            <div className="flex flex-col items-center">
                                <Card className="w-full h-28 border-blue-100 dark:border-blue-900 shadow-md transform hover:scale-[1.01] transition-transform duration-200">
                                    <CardContent className="h-full flex flex-col items-center justify-center text-center p-2">
                                        <div className="text-xs font-bold uppercase tracking-widest mb-1">Overall Score</div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 drop-shadow-sm">
                                                {selectedQuestion.evaluation.overall.toFixed(1)}
                                            </span>
                                            <span className="text-2xl text-muted-foreground font-medium font-sans">/ 10</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>


                            {/* Row 5: Strengths | Areas for Improvement */}

                            {/* Strengths */}
                            <div>
                                <h4 className="text-lg font-bold text-foreground mb-3">Strengths:</h4>
                                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-6 h-full shadow-sm">
                                    {selectedQuestion.evaluation.strengths && selectedQuestion.evaluation.strengths.length > 0 ? (
                                        <ul className="space-y-3">
                                            {selectedQuestion.evaluation.strengths.map((s, idx) => (
                                                <li key={idx} className="flex gap-3 text-base text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-500" />
                                                    <span>{s}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground italic">No specific strengths noted.</p>
                                    )}
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div>
                                <h4 className="text-lg font-bold text-foreground mb-3">Areas for Improvement:</h4>
                                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl p-6 h-full shadow-sm">
                                    {selectedQuestion.evaluation.weaknesses && selectedQuestion.evaluation.weaknesses.length > 0 ? (
                                        <ul className="space-y-3">
                                            {selectedQuestion.evaluation.weaknesses.map((w, idx) => (
                                                <li key={idx} className="flex gap-3 text-base text-red-800 dark:text-red-300 leading-relaxed">
                                                    <XCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600 dark:text-red-500" />
                                                    <span>{w}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-muted-foreground italic">No specific improvements noted.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 
              Content Grid
              - 'flex-1 min-h-0' makes it take remaining height and ALLOWS shrinkage/scrolling.
              - On desktop (lg), it's a 4-column grid.
              - On mobile, it stacks naturally.
            */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

                {/* 
                  LEFT COMPONENT (Filter Panel)
                  - On desktop: 'h-full flex flex-col' ensures it fills the grid column height.
                  - Filters themselves live in a scrollable CardContent.
                  - It stays "sticky"/fixed effectively because the container doesn't scroll, 
                    only the content inside this Card (if needed) and the Right Component.
                */}
                <div className="lg:col-span-1 h-full animate-in fade-in slide-in-from-left-8 duration-700 ease-out fill-mode-both">
                    <Card className="h-full flex flex-col shadow-md border-slate-200 !py-0 !gap-0">
                        <CardHeader className="p-3 !pb-0 shrink-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-blue-600" /> Filters
                                </CardTitle>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-red-500" 
                                    onClick={clearAllFilters}
                                    title="Clear all filters"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {/* Search */}
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Filename or skill..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Status and Skill Filters Side-by-Side */}
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Status Filter */}
                                <div className="space-y-2 flex-1">
                                    <Label>Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            <SelectItem value="Selected">Selected</SelectItem>
                                            <SelectItem value="Conditional">Conditional</SelectItem>
                                            <SelectItem value="Rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Skill Filter */}
                                <div className="space-y-2 flex-1">
                                    <Label>Skill</Label>
                                    <Select value={skillFilter} onValueChange={setSkillFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Skill" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            {SKILL_CATEGORIES.map(skill => (
                                                <SelectItem key={skill} value={skill}>
                                                    {skill.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Experience Filter */}
                                <div className="space-y-2 flex-1">
                                    <Label>Experience</Label>
                                    <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Experience" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All</SelectItem>
                                            {uniqueExperiences.map(exp => (
                                                <SelectItem key={exp} value={exp}>{exp}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Score Range */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Score Range</Label>
                                    <span className="text-sm text-muted-foreground">{scoreRange[0]} - {scoreRange[1]}</span>
                                </div>
                                <Slider
                                    defaultValue={[0, 10]}
                                    max={10}
                                    step={1}
                                    value={scoreRange}
                                    onValueChange={setScoreRange}
                                    className="my-4"
                                />
                            </div>


                            <Separator />

                            {/* Calendar */}
                            <div className="space-y-2">
                                <Label>Interview Dates</Label>
                                <div className="flex justify-center bg-blue-50/50 dark:bg-slate-900/50 rounded-xl p-2 border border-blue-100 dark:border-slate-800 h-[350px] items-start">
                            <Calendar
                                        mode="single"
                                        selected={dateFilter}
                                        onSelect={setDateFilter}
                                        className="rounded-md border-none shadow-none w-full"
                                        modifiers={{
                                            low: (date) => {
                                                const c = interviewCounts[date.toDateString()] || 0
                                                return c >= 1 && c <= 5
                                            },
                                            medium: (date) => {
                                                const c = interviewCounts[date.toDateString()] || 0
                                                return c >= 6 && c <= 15
                                            },
                                            high: (date) => {
                                                const c = interviewCounts[date.toDateString()] || 0
                                                return c > 15
                                            }
                                        }}
                                        modifiersClassNames={{
                                            low: "bg-blue-500/20 text-blue-700 font-semibold hover:bg-blue-500/30",
                                            medium: "bg-orange-500/20 text-orange-700 font-semibold hover:bg-orange-500/30",
                                            high: "bg-red-500/20 text-red-700 font-semibold hover:bg-red-500/30"
                                        }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 
                  RIGHT COMPONENT (Reports & Metrics)
                  - On desktop: 'h-full overflow-y-auto' enables independent scrolling.
                  - The Main Layout/Body will NOT scroll; this div scrolls instead.
                  - Added padding-right/bottom for scrollbar comfort.
                */}
                <div className="lg:col-span-3 h-full overflow-y-auto pr-2 pb-2 space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-8 duration-700 ease-out fill-mode-both delay-100">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Reports</CardDescription>
                                <CardTitle className="text-2xl">{metrics.total}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Avg Score</CardDescription>
                                <CardTitle className="text-2xl">{metrics.avgScore}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Avg Questions</CardDescription>
                                <CardTitle className="text-2xl">{metrics.avgQuestions}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Selection Rate</CardDescription>
                                <CardTitle className="text-2xl">
                                    {metrics.total > 0 ? Math.round((metrics.selected / metrics.total) * 100) : 0}%
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Status Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-8 duration-700 ease-out fill-mode-both delay-200">
                        <div className="bg-card p-4 rounded-lg border border-l-4 border-l-emerald-500 shadow-sm">
                            <div className="text-emerald-500 font-bold text-2xl">{metrics.selected}</div>
                            <div className="text-muted-foreground text-sm">Selected</div>
                        </div>
                        <div className="bg-card p-4 rounded-lg border border-l-4 border-l-amber-500 shadow-sm">
                            <div className="text-amber-500 font-bold text-2xl">{metrics.conditional}</div>
                            <div className="text-muted-foreground text-sm">Conditional</div>
                        </div>
                        <div className="bg-card p-4 rounded-lg border border-l-4 border-l-red-500 shadow-sm">
                            <div className="text-red-500 font-bold text-2xl">{metrics.rejected}</div>
                            <div className="text-muted-foreground text-sm">Rejected</div>
                        </div>
                    </div>

                    {/* Reports List / Results */}
                    <Tabs defaultValue="detailed">
                        <div className="flex justify-between items-center mb-4">
                            <TabsList>
                                <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                                <TabsTrigger value="table">Table View</TabsTrigger>
                                <TabsTrigger value="analytics">Summary Analytics</TabsTrigger>
                            </TabsList>
                            <span className="text-sm text-muted-foreground">Showing {filteredReports.length} reports</span>
                        </div>

                        <TabsContent value="detailed" className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both delay-300">
                            {filteredReports.length === 0 ? (
                                <div className="text-center py-12 bg-card rounded-lg border">
                                    <p className="text-muted-foreground">No reports match your filters.</p>
                                    <Button variant="link" onClick={clearAllFilters}>Clear Filters</Button>
                                </div>
                            ) : (

                                <Accordion type="single" collapsible className="space-y-4">
                                    {filteredReports.map((report, idx) => (
                                        <AccordionItem value={`item-${idx}`} key={idx} className="bg-card border rounded-lg px-4 shadow-sm hover:shadow-md transition-shadow border-0">
                                            <AccordionTrigger className="hover:no-underline py-4">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 gap-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="font-semibold text-lg flex items-center gap-2">
                                                            {report.display_date_short}
                                                            {report.status === 'Selected' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                                            {report.status === 'Conditional' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                                                            {report.status === 'Rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">{report.filename}</div>
                                                    </div>

                                                    <div className="flex gap-4 items-center">
                                                        <div className="text-right w-16">
                                                            <div className="text-xs text-muted-foreground uppercase">Score</div>
                                                            <div className="font-bold text-xl">{report.overall_score.toFixed(1)}</div>
                                                        </div>
                                                        <div className="text-right border-l pl-4 w-24">
                                                            <div className="text-xs text-muted-foreground uppercase">Exp</div>
                                                            <div className="font-medium truncate" title={report.candidate_profile.experience_level || 'N/A'}>
                                                                {report.candidate_profile.experience_level || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="w-28 flex justify-end">
                                                            <Badge variant="outline" className={`w-full justify-center
                                                                ${report.status === 'Selected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                                ${report.status === 'Conditional' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                                ${report.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                            `}>
                                                                {report.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-2 pb-6">
                                                <Separator className="my-4" />

                                                {/* Profile Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-muted/50 p-4 rounded-lg">
                                                    <div>
                                                        <div className="text-sm text-gray-500">Primary Skill</div>
                                                        <div className="font-medium">{report.candidate_profile.primary_skill || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Confidence</div>
                                                        <div className="font-medium">{report.candidate_profile.confidence || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Communication</div>
                                                        <div className="font-medium">{report.candidate_profile.communication || 'N/A'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-gray-500">Intro Score</div>
                                                        <div className="font-medium">{report.candidate_profile.intro_score}/10</div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div>
                                                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                                                            <FileText className="h-4 w-4" /> Question Analysis
                                                        </h4>
                                                        <ScrollArea className="h-[300px] w-full pr-4">
                                                            <div className="space-y-6">
                                                                {report.question_evaluations.map((q, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="bg-muted/30 p-3 rounded-lg border cursor-pointer hover:bg-muted/70 hover:border-blue-200 transition-colors group"
                                                                        onClick={() => setSelectedQuestion(q)}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <span className="font-small text-xs uppercase text-muted-foreground group-hover:text-primary">Q{i + 1}</span>
                                                                            <Badge variant="secondary" className="group-hover:bg-blue-100 group-hover:text-blue-700">{q.evaluation.overall}/10</Badge>
                                                                        </div>
                                                                        <p className="text-sm font-medium mb-1 line-clamp-2">{q.question}</p>

                                                                        <div className="mt-2 text-xs text-muted-foreground group-hover:text-primary flex items-center justify-end">
                                                                            View Analysis <ChevronDown className="h-3 w-3 ml-1 -rotate-90" />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>

                                                    <div className="flex flex-col gap-6">
                                                        <div>
                                                            <h4 className="font-semibold mb-4">Score Distribution</h4>
                                                            <ScoreDistributionChart report={report} />
                                                        </div>

                                                        <div className="mt-auto flex gap-3">
                                                            <Button onClick={() => downloadFile(JSON.stringify(report, null, 2), report.filename, 'json')} variant="outline" size="sm" className="w-full">
                                                                <Download className="h-4 w-4 mr-2" /> JSON
                                                            </Button>
                                                            <Button onClick={() => downloadFile(generateTextReport(report), report.filename.replace('.json', '.txt'), 'txt')} variant="outline" size="sm" className="w-full">
                                                                <Download className="h-4 w-4 mr-2" /> Text Report
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </TabsContent>

                        <TabsContent value="table" className="animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-end mb-4">
                                <Button onClick={downloadCSV} variant="outline" className="gap-2 bg-background hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm">
                                    <FileText className="h-4 w-4" /> Export to Excel
                                </Button>
                            </div>
                            <Card>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Candidate</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Primary Skill</TableHead>
                                                <TableHead>Experience</TableHead>
                                                <TableHead className="text-right">Score</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredReports.map((report, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium">{report.filename.replace('.json', '')}</TableCell>
                                                    <TableCell>{report.display_date_short}</TableCell>
                                                    <TableCell>{report.candidate_profile.primary_skill || 'N/A'}</TableCell>
                                                    <TableCell className="capitalize">{report.candidate_profile.experience_level || 'N/A'}</TableCell>
                                                    <TableCell className="text-right font-bold">{report.overall_score.toFixed(1)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className={`
                                                            ${report.status === 'Selected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                            ${report.status === 'Conditional' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                            ${report.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                                        `}>
                                                            {report.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredReports.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center">
                                                        No reports found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="animate-in fade-in zoom-in-95 duration-300">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Overview & Analysis</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                                        <div className="flex-1 w-full h-[250px]">
                                            <StatusChart data={[
                                                { name: 'Selected', value: metrics.selected, color: '#10b981' },
                                                { name: 'Conditional', value: metrics.conditional, color: '#f59e0b' },
                                                { name: 'Rejected', value: metrics.rejected, color: '#ef4444' }
                                            ].filter(d => d.value > 0)} />
                                        </div>
                                        
                                        <div className="w-full lg:w-1/3 grid grid-cols-2 gap-4">
                                            <div className="bg-muted/30 p-4 rounded-xl border text-center flex flex-col justify-center">
                                                <div className="text-3xl font-bold text-foreground">{metrics.avgScore}</div>
                                                <div className="text-sm text-muted-foreground">Average Overall Score</div>
                                            </div>
                                            <div className="bg-muted/30 p-4 rounded-xl border text-center flex flex-col justify-center">
                                                <div className="text-3xl font-bold text-foreground">{metrics.total}</div>
                                                <div className="text-sm text-muted-foreground">Total Interviews</div>
                                            </div>
                                            <div className="bg-muted/30 p-4 rounded-xl border text-center flex flex-col justify-center">
                                                <div className="text-3xl font-bold text-foreground">{metrics.avgQuestions}</div>
                                                <div className="text-sm text-muted-foreground">Avg Questions Answered</div>
                                            </div>
                                            <div className="bg-muted/30 p-4 rounded-xl border text-center flex flex-col justify-center">
                                                <div className="text-3xl font-bold text-foreground">
                                                    {metrics.total > 0 ? Math.round((metrics.selected / metrics.total) * 100) : 0}%
                                                </div>
                                                <div className="text-sm text-muted-foreground">Selection Rate</div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
