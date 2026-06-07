import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const splitSteps = { '/upload': 1, '/split': 2 }

function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const currentStep = splitSteps[pathname]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="glass-card flex items-center justify-between rounded-2xl px-5 py-4 md:px-7">
      <Link to={user ? '/dashboard' : '/'} className="font-['Syne'] text-xl font-semibold tracking-tight">
        Papyrus
      </Link>

      <div className="flex items-center gap-4">
        {currentStep && (
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                    currentStep >= step ? 'bg-[#f5a623]' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-white/50">{currentStep} / 2</p>
          </div>
        )}

        {user ? (
          <div className="flex items-center gap-3">
            {!currentStep && (
              <Link
                to="/friends"
                className="text-sm text-white/50 transition hover:text-white/80"
              >
                Friends
              </Link>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5a623]/20 text-sm font-semibold text-[#f5a623]">
              {user.user_metadata?.full_name?.[0] ?? user.email?.[0]?.toUpperCase()}
            </div>
            <button
              onClick={handleSignOut}
              className="text-white/35 transition hover:text-white/70"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          !currentStep && (
            <Link to="/login" className="text-sm text-white/50 transition hover:text-white/80">
              Sign in
            </Link>
          )
        )}
      </div>
    </header>
  )
}

export default Navbar
