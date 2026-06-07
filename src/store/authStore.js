import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: true,

  init: () => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false })
    })
    return () => subscription.unsubscribe()
  },

  signOut: () => supabase.auth.signOut(),
}))
