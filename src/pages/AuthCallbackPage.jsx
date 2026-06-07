import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const hasCode = new URL(window.location.href).searchParams.has('code')

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard', { replace: true })
      } else if (event === 'INITIAL_SESSION' && !session && !hasCode) {
        navigate('/login', { replace: true })
      }
      // hasCode + INITIAL_SESSION null = auto-exchange in progress, keep waiting
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-white/40">Signing you in…</p>
    </div>
  )
}

export default AuthCallbackPage
