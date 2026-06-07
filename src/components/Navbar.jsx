import { useLocation } from 'react-router-dom'

const stepsByRoute = {
  '/upload': 1,
  '/parse': 2,
  '/split': 3,
  '/summary': 4,
}

function Navbar() {
  const { pathname } = useLocation()
  const currentStep = stepsByRoute[pathname]

  return (
    <header className="glass-card flex items-center justify-between rounded-2xl px-5 py-4 md:px-7">
      <p className="font-['Syne'] text-xl font-semibold tracking-tight">Papyrus</p>
      <p className="text-sm text-white/70">
        {currentStep ? `Step ${currentStep} of 4` : 'Get Started'}
      </p>
    </header>
  )
}

export default Navbar
