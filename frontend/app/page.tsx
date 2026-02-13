'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, ChevronRight, PlayCircle, Star, Users, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { DarkModeParticles } from '@/components/dark-mode-particles'

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Loading experience...</p>
        </div>
      </div>
    )
  }


  // ... existing code ...

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      <DarkModeParticles />
      
      {/* Navigation - Glassmorphism */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Caldim.ai Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300">
              Caldim<span className="font-light text-slate-500 dark:text-slate-400">.ai</span>
            </span>
          </div>
          
          <div className="flex gap-4 items-center">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10 font-medium transition-colors">
                    Log in
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-primary/30 rounded-full px-6">
                    Get Started <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3 bg-secondary px-4 py-2 rounded-full border border-border">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">
                  Welcome back, {user?.full_name?.split(' ')[0]}
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        {/* Abstract Background Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-8 shadow-sm">
              <Star className="h-3 w-3 fill-indigo-700" />
              Next Gen Recruitment
            </div>
            
            <div className="mb-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                &ldquo;Great vision without great people is <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 ">irrelevant</span>.&rdquo;
              </h1>
              <p className="mt-4 text-2xl md:text-3xl font-medium text-muted-foreground">
                - Jim Collins
              </p>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto font-light">
              Experience the future of talent acquisition with AI-driven interviews, instant resume parsing, and unbiased automated scoring.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isAuthenticated && (
                <>
                  <Link href="/auth/register?role=candidate">
                    <Button size="lg" className="h-14 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl hover:shadow-indigo-500/40 transition-all duration-300">
                      I'm a Candidate
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/auth/login?role=hr">
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-border text-foreground hover:border-primary hover:text-primary bg-transparent rounded-full transition-all duration-300">
                      I'm Hiring
                    </Button>
                  </Link>
                </>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="h-8 w-8 text-amber-500" />}
              title="AI Interviews"
              desc="Adaptive conversational AI that interviews candidates in real-time, asking follow-up questions tailored to their expertise."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="h-8 w-8 text-emerald-500" />}
              title="Smart Screening"
              desc="Automatically parse resumes and match skills against job descriptions accurately."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-indigo-500" />}
              title="Unbiased Scoring"
              desc="Data-driven evaluation reports that highlight technical strengths and soft skills without human bias."
            />
          </div>
        </div>
      </div>

      {/* Dual Audience Section */}
      <div className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* Candidate Card */}
            <div className="group relative bg-card/5 backdrop-blur-md rounded-3xl p-10 shadow-lg border border-white/10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="h-40 w-40 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-6">For Candidates</h3>
              <ul className="space-y-4 mb-8">
                <ListItem text="Apply with one click" />
                <ListItem text="Practice with AI interviews" />
                <ListItem text="Get instant feedback & learning" />
                <ListItem text="Track real-time status" />
              </ul>
              <Link href="/auth/register?role=candidate">
                 <Button variant="link" className="text-indigo-600 hover:text-indigo-800 p-0 text-lg font-semibold">
                   Join as Talent &rarr;
                 </Button>
              </Link>
            </div>

            {/* HR Card */}
            <div className="group relative bg-card/5 backdrop-blur-md rounded-3xl p-10 shadow-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-white/10">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-6">For HR Teams</h3>
                <ul className="space-y-4 mb-8">
                  <ListItem text="Post jobs in seconds" dark={true} />
                  <ListItem text="Automate initial screening" dark={true} />
                  <ListItem text="View detailed candidate analytics" dark={true} />
                  <ListItem text="Reduce time-to-hire by 50%" dark={true} />
                </ul>
                <Link href="/auth/login?role=hr">
                  <Button className="bg-foreground text-background hover:bg-muted rounded-full px-8 py-6 text-lg font-bold">
                    Start Hiring Now
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 relative z-10 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Caldim.ai Logo" className="h-8 w-auto" />
            <span className="text-lg font-bold text-foreground">Caldim.ai</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2026 Caldim Engineering. Built for the future of work.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Sub-components for cleanliness
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-card/5 backdrop-blur-md border border-white/10 hover:border-primary/30 hover:bg-card/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
      <div className="mb-6 p-3 bg-background rounded-xl shadow-sm inline-block group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
        {desc}
      </p>
    </div>
  )
}

function ListItem({ text, dark = false }: { text: string, dark?: boolean }) {
  return (
    <li className={`flex gap-3 items-center ${dark ? 'text-slate-300' : 'text-foreground'}`}>
      <div className={`p-1 rounded-full ${dark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-primary/10 text-primary'}`}>
        <CheckCircle2 className="h-4 w-4" />
      </div>
      {text}
    </li>
  )
}
