'use client'

import React from "react"

import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'candidate' | 'hr'>(
    (searchParams.get('role') as 'candidate' | 'hr') || 'candidate'
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)

    try {
      await register(email, password, fullName, role)
      router.push(role === 'hr' ? '/dashboard/hr' : '/dashboard/candidate')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-600 mb-2">Caldim Recruitment Portal</CardTitle>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="candidate"
                    checked={role === 'candidate'}
                    onChange={(e) => setRole(e.target.value as 'candidate' | 'hr')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Job Seeker</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="hr"
                    checked={role === 'hr'}
                    onChange={(e) => setRole(e.target.value as 'candidate' | 'hr')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">HR Manager</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
                disabled={isSubmitting}
              />
            </div>

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
              <p className="text-xs text-gray-500 mt-1">Min. 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
