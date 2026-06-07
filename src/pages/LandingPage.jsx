import { motion } from 'framer-motion'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

const container = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, staggerChildren: 0.14 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
}

function LandingPage() {
  const { user, loading } = useAuthStore()
  const hasCode = window.location.search.includes('code=')
  const hasError = window.location.search.includes('error=')

  // Wait while auth code is being exchanged
  if (hasCode && !user) return null

  // Auth error from Supabase — just show the landing page
  if (hasError) window.history.replaceState({}, '', '/')

  // Redirect authenticated users straight to dashboard
  if (!loading && user) return <Navigate to="/dashboard" replace />

  return (
    <motion.section
      className="glass-card mx-auto mt-14 max-w-4xl rounded-3xl p-8 text-center md:p-14"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.p
        variants={item}
        className="mx-auto w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs tracking-[0.2em] text-[#f5a623]"
      >
        PAPYRUS
      </motion.p>
      <motion.h1 variants={item} className="mt-5 text-4xl font-semibold md:text-6xl">
        Papyrus
      </motion.h1>
      <motion.p variants={item} className="mt-4 text-lg text-white/70 md:text-xl">
        Split smarter, not harder
      </motion.p>
      <motion.div variants={item} className="mt-10">
        <Button
          asChild
          className="gold-ring h-11 rounded-xl bg-[#f5a623] px-6 text-[0.95rem] font-semibold text-black hover:bg-[#f6b03f]"
        >
          <Link to="/login">Start Splitting</Link>
        </Button>
      </motion.div>
    </motion.section>
  )
}

export default LandingPage
