'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function DashboardRedirect() {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && user) {
            if (user.role === 'hr') {
                router.push('/dashboard/hr')
            } else {
                router.push('/dashboard/candidate')
            }
        } else if (!isLoading && !user) {
            router.push('/')
        }
    }, [user, isLoading, router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )
}
