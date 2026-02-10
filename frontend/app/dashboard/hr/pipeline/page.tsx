"use client"

import { PipelineBoard } from "@/components/pipeline-board"

export default function HRPipelinePage() {
    return (
        <div className="h-[calc(100vh-4rem)] p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Hiring Pipeline</h1>
            </div>
            <div className="flex-1 overflow-hidden">
                <PipelineBoard />
            </div>
        </div>
    )
}
