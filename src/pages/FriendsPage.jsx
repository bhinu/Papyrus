import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

function FriendsPage() {
  const { user } = useAuthStore()
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [pendingSent, setPendingSent] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFriends()
  }, [])

  const fetchFriends = async () => {
    setLoading(true)

    const [{ data: friendshipRows }, { data: incomingRows }] = await Promise.all([
      supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted'),
      supabase
        .from('friendships')
        .select('id, requester_id')
        .eq('addressee_id', user.id)
        .eq('status', 'pending'),
    ])

    // Resolve friend profile IDs
    const friendIds = (friendshipRows ?? []).map((row) =>
      row.requester_id === user.id ? row.addressee_id : row.requester_id,
    )
    const incomingIds = (incomingRows ?? []).map((row) => row.requester_id)

    const allIds = [...new Set([...friendIds, ...incomingIds])]

    let profileMap = {}
    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', allIds)
      profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
    }

    setFriends(friendIds.map((id) => profileMap[id]).filter(Boolean))
    setIncoming(
      (incomingRows ?? [])
        .map((row) => ({ friendshipId: row.id, profile: profileMap[row.requester_id] }))
        .filter((r) => r.profile),
    )

    // Track who we've already sent a request to
    const { data: sentRows } = await supabase
      .from('friendships')
      .select('addressee_id')
      .eq('requester_id', user.id)
      .eq('status', 'pending')
    setPendingSent(new Set((sentRows ?? []).map((r) => r.addressee_id)))

    setLoading(false)
  }

  const sendRequest = async (profileId) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: user.id, addressee_id: profileId, status: 'pending' })
    if (!error) {
      setPendingSent((prev) => new Set([...prev, profileId]))
    }
  }

  const respond = async (friendshipId, status) => {
    await supabase.from('friendships').update({ status }).eq('id', friendshipId)
    fetchFriends()
  }

  const searchUsers = async (query) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', `%${query.trim()}%`)
      .neq('id', user.id)
      .limit(8)
    const friendIds = new Set(friends.map((f) => f.id))
    setSearchResults((data ?? []).filter((p) => !friendIds.has(p.id)))
  }

  if (loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <h1 className="text-3xl font-semibold">Friends</h1>

      {/* Search */}
      <div className="glass-card rounded-3xl p-6">
        <p className="text-sm font-medium">Find people</p>
        <input
          value={searchQuery}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder="Search by name…"
          className="mt-3 h-10 w-full rounded-xl border border-white/20 bg-white/[0.03] px-3 text-sm outline-none transition focus:border-[#f5a623]/70"
        />
        {searchQuery.trim().length >= 2 && (
          <div className="mt-3 space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-sm text-white/35">No one found with that name.</p>
            ) : (
              searchResults.map((p) => {
                const sent = pendingSent.has(p.id)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
                        {p.full_name?.[0] ?? '?'}
                      </div>
                      <span className="text-sm">{p.full_name}</span>
                    </div>
                    <Button
                      onClick={() => sendRequest(p.id)}
                      disabled={sent}
                      className="h-7 rounded-lg bg-[#f5a623] px-3 text-xs font-semibold text-black hover:bg-[#f6b03f] disabled:opacity-50"
                    >
                      {sent ? 'Sent' : (
                        <span className="flex items-center gap-1">
                          <UserPlus size={12} /> Add
                        </span>
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <p className="text-sm font-medium">Friend requests</p>
          <ul className="mt-3 space-y-3">
            {incoming.map(({ friendshipId, profile }) => (
              <li key={friendshipId} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-medium">
                    {profile.full_name?.[0] ?? '?'}
                  </div>
                  <span className="text-sm">{profile.full_name}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respond(friendshipId, 'accepted')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 transition hover:bg-emerald-500/30"
                    aria-label="Accept"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => respond(friendshipId, 'declined')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/50 transition hover:bg-white/15"
                    aria-label="Decline"
                  >
                    <X size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Friends list */}
      <div className="glass-card rounded-3xl p-6">
        <p className="text-sm font-medium">
          Your friends{friends.length > 0 && <span className="ml-1.5 text-white/35">{friends.length}</span>}
        </p>
        {friends.length === 0 ? (
          <p className="mt-3 text-sm text-white/35">No friends yet — search for someone above.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {friends.map((f) => (
              <li key={f.id} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5a623]/20 text-sm font-semibold text-[#f5a623]">
                  {f.full_name?.[0] ?? '?'}
                </div>
                <span className="text-sm">{f.full_name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}

export default FriendsPage
