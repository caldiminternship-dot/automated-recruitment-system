'use client'

import React from "react"

import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setError('Session expired. Please login again.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      router.push('/dashboard')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-600 mb-2">Caldim Recruitment Portal</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
