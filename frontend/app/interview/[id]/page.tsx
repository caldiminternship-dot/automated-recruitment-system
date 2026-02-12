'use client'

import React, { useEffect, useState, useRef } from 'react'
import { APIClient } from '@/lib/api-client'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'

// Web Speech API Types
interface IWindow extends Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
}

interface Question {
    id: number
    question_number: number
    question_text: string
    question_type: string
}

export default function InterviewPage() {
    const params = useParams()
    const router = useRouter()
    const interviewId = params.id as string

    const [question, setQuestion] = useState<Question | null>(null)
    const [answer, setAnswer] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [interviewStatus, setInterviewStatus] = useState('loading')

    const [warnings, setWarnings] = useState(0)

    // Voice to Text State
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)

    const [interviewData, setInterviewData] = useState<any>(null)
    const [lastSubmissionStatus, setLastSubmissionStatus] = useState<'success' | null>(null)

    useEffect(() => {
        loadInterviewDetails()
        loadCurrentQuestion()

        // Anti-Cheat: Terminate on 3rd Tab Switch (2 warnings)
        const handleVisibilityChange = async () => {
            if (document.hidden && interviewStatus === 'active') {
                const currentWarnings = warnings + 1
                setWarnings(currentWarnings)

                if (currentWarnings >= 3) {
                    try {
                        await APIClient.post(`/api/interviews/${interviewId}/end`, {})
                    } catch (error) {
                        console.log("Failed to end interview (might be already completed)", error)
                    }
                    alert("Violation Detected: You exceeded the limit of tab switches (2 warnings). Your interview has been terminated.")
                    router.push('/dashboard/candidate')
                } else {
                    alert(`Warning ${currentWarnings}/2: Focusing away from the interview tab is not allowed. Next violation may terminate your session.`)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [interviewId, interviewStatus, warnings])

    const loadInterviewDetails = async () => {
        try {
            const data = await APIClient.get(`/api/interviews/${interviewId}`)
            setInterviewData(data)
        } catch (err) {
            console.error("Failed to load interview details", err)
        }
    }

    // ... (rest of voice logic) ...

    const startListening = () => {
        const windowObj = window as unknown as IWindow
        if (!('webkitSpeechRecognition' in windowObj) && !('SpeechRecognition' in windowObj)) {
            alert("Your browser does not support voice recognition. Please use Chrome or Edge.")
            return
        }

        const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onstart = () => {
            setIsListening(true)
        }

        recognition.onresult = (event: any) => {
            let finalTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript
                }
            }

            if (finalTranscript) {
                setAnswer(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + finalTranscript)
            }
        }

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                return
            }
            console.error("Speech recognition error", event.error)
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition
        recognition.start()
    }

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }

    const toggleListening = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    const loadCurrentQuestion = async () => {
        try {
            setIsLoading(true)
            const q = await APIClient.get<Question>(`/api/interviews/${interviewId}/current-question`)
            setQuestion(q)
            setInterviewStatus('active')
        } catch (err: any) {
            // Handle "Interview complete" (410 Gone)
            if (err.message && (err.message.toLowerCase().includes('complete') || err.message.includes('Gone') || err.message.includes('410'))) {
                try {
                    await APIClient.post(`/api/interviews/${interviewId}/end`, {})
                } catch (e) {
                    console.log("Interview already ended or failed to end", e)
                }
                setInterviewStatus('completed')
            } else if (err.message && err.message.includes('404')) {
                setInterviewStatus('completed')
            } else {
                console.error(err)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!answer.trim()) return

        stopListening() // Stop if recording
        setIsSubmitting(true)
        setLastSubmissionStatus(null)

        try {
            await APIClient.post(`/api/interviews/${interviewId}/submit-answer`, {
                answer_text: answer
            })

            // Show success feedback briefly
            setLastSubmissionStatus('success')
            setTimeout(() => {
                setLastSubmissionStatus(null)
                setAnswer('')
                loadCurrentQuestion()
            }, 1000)

        } catch (err) {
            alert('Failed to submit answer. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading || interviewStatus === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">AI is preparing your interview...</p>
                </div>
            </div>
        )
    }

    if (interviewStatus === 'completed') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center border border-border">
                    <div className="mb-6 text-green-500">
                        <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-4">Interview Completed</h1>
                    <p className="text-muted-foreground mb-8">
                        Thank you for completing the interview. Your responses have been submitted for AI analysis. HR will review your results shortly.
                    </p>
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => router.push('/dashboard/candidate')}
                    >
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* Header */}
            <div className="bg-background/80 backdrop-blur-md shadow-sm border-b border-border px-8 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 dark:from-blue-400 dark:to-blue-200 bg-clip-text text-transparent">
                        AI Interview Assistant
                    </h1>
                    {interviewData?.locked_skill && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded-full">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locked Skill:</span>
                            <span className="text-sm font-bold text-foreground uppercase">{interviewData.locked_skill}</span>
                            <span className="text-xs text-muted-foreground">🔒</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-lg border border-border">
                        Question {question?.question_number}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">

                {/* AI Question Section */}
                <div className="bg-card rounded-2xl shadow-lg shadow-blue-900/5 border border-border p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-left-8 duration-700 ease-out fill-mode-both">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-500 to-blue-700"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <svg className="w-32 h-32 text-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" /></svg>
                    </div>


                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Current Question
                    </p>
                    <h2 className="text-2xl md:text-3xl font-medium text-foreground leading-relaxed relative z-10">
                        {question?.question_text}
                    </h2>
                </div>

                {/* Answer Section */}
                <div className="flex-1 bg-card rounded-2xl shadow-md border border-border p-8 flex flex-col relative animate-in fade-in slide-in-from-right-8 duration-700 ease-out fill-mode-both delay-200">
                    {lastSubmissionStatus === 'success' && (
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-300">
                            <div className="bg-green-100 text-green-700 p-4 rounded-full mb-4">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-foreground">Answer Recorded</h3>
                            <p className="text-muted-foreground">Preparing next question...</p>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                        <label htmlFor="answer" className="text-sm font-semibold text-foreground flex items-center gap-2">
                            Your Response
                        </label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleListening}
                            className={`flex items-center gap-2 transition-all duration-300 ${isListening
                                ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 ring-2 ring-red-100'
                                : 'text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/20'
                                }`}
                        >
                            {isListening ? (
                                <>
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                    Stop Recording
                                </>
                            ) : (
                                <>
                                    <Mic className="h-4 w-4" />
                                    Voice Input
                                </>
                            )}
                        </Button>
                    </div>

                    <textarea
                        id="answer"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className={`flex-1 w-full p-5 border rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 resize-none text-lg leading-relaxed transition-all shadow-inner bg-muted/30 focus:bg-background text-foreground ${isListening ? 'border-red-300 bg-red-50/10' : 'border-input'
                            }`}
                        placeholder={isListening ? "Listening... Speak clearly." : "Type your answer here..."}
                        autoFocus
                    />

                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-border">
                        <p className="text-sm text-muted-foreground font-medium">
                            {isListening ?
                                <span className="text-red-500 animate-pulse">● Recording active</span>
                                : 'Press Enter to submit (if configured) or click button'}
                        </p>
                        <Button
                            onClick={handleSubmit}
                            disabled={!answer.trim() || isSubmitting}
                            className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Submit Answer'
                            )}
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    )
}
