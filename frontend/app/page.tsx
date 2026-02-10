'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role === 'candidate') {
        router.push('/dashboard/candidate')
      } else if (user.role === 'hr') {
        router.push('/dashboard/hr')
      }
    }
  }, [isAuthenticated, user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-blue-600">HireAI</div>
        <div className="flex gap-4">
          {!isAuthenticated ? (
            <>
              <Link href="/auth/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Sign Up</Button>
              </Link>
            </>
          ) : (
            <div className="text-gray-700">
              Welcome, <span className="font-semibold">{user?.full_name}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 text-balance">
            AI-Powered Recruitment Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8 text-balance max-w-2xl mx-auto">
            Streamline your hiring process with intelligent interviews, automated resume screening, and data-driven decisions.
          </p>
          <div className="flex gap-4 justify-center">
            {!isAuthenticated && (
              <>
                <Link href="/auth/register?role=candidate">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                    Apply as Candidate
                  </Button>
                </Link>
                <Link href="/auth/login?role=hr">
                  <Button variant="outline" className="px-8 py-3 bg-transparent">
                    Access HR Portal
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 my-20">
          <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Interviews</h3>
            <p className="text-gray-600">
              Intelligent, adaptive interviews that adjust questions based on candidate responses, saving time and ensuring fairness.
            </p>
          </div>

          <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Resume Screening</h3>
            <p className="text-gray-600">
              Automatic resume parsing and skill matching against job requirements, identifying the best candidates instantly.
            </p>
          </div>

          <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Data-Driven Decisions</h3>
            <p className="text-gray-600">
              Comprehensive interview reports with skill assessments and recommendations to support your hiring decisions.
            </p>
          </div>
        </div>

        {/* For Candidates */}
        <div className="bg-white rounded-lg shadow-md p-12 mb-12 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">For Candidates</h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  Browse and apply for exciting opportunities
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  Participate in fair, AI-powered interviews
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  Get instant feedback on your performance
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  Track your application status in real-time
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg h-64 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-5xl mb-2">💼</div>
                <p className="text-lg font-semibold">Ready to grow your career?</p>
              </div>
            </div>
          </div>
        </div>

        {/* For HR */}
        <div className="bg-white rounded-lg shadow-md p-12 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg h-64 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-5xl mb-2">👥</div>
                <p className="text-lg font-semibold">Hire faster, smarter</p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">For HR Teams</h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">✓</span>
                  Create and manage job postings effortlessly
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">✓</span>
                  Automated resume screening and skill matching
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">✓</span>
                  AI conducts interviews while you focus on strategy
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">✓</span>
                  Detailed analytics and hiring recommendations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2024 HireAI. AI-powered recruitment platform for modern teams.
          </p>
        </div>
      </footer>
    </div>
  )
}
