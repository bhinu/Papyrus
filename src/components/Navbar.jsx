import { useLocation } from 'react-router-dom'

const stepsByRoute = {
  '/upload': 1,
  '/split': 2,
}

function Navbar() {
  const { pathname } = useLocation()
  const currentStep = stepsByRoute[pathname]

  return (
    <header className="glass-card flex items-center justify-between rounded-2xl px-5 py-4 md:px-7">
      <p className="font-['Syne'] text-xl font-semibold tracking-tight">Papyrus</p>

      {currentStep ? (
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
          <p className="text-xs text-white/50">
            {currentStep} / 2
          </p>
        </div>
      ) : (
        <p className="text-sm text-white/50">Split smarter</p>
      )}
    </header>
  )
}

export default Navbar
