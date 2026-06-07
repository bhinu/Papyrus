import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useSplitStore } from '@/store/splitStore'

function GroupDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const startGroupSplit = useSplitStore((s) => s.startGroupSplit)
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [splits, setSplits] = useState([])
  const [balances, setBalances] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteQuery, setInviteQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteStatus, setInviteStatus] = useState('')

  useEffect(() => {
    fetchGroup()
  }, [id])

  const fetchGroup = async () => {
    setLoading(true)

    const [{ data: grp }, { data: memberRows }, { data: splitRows }, { data: balanceRows }, { data: friendshipRows }] =
      await Promise.all([
        supabase.from('groups').select('*').eq('id', id).single(),
        supabase
          .from('group_members')
          .select('user_id, profiles(id, full_name, avatar_url)')
          .eq('group_id', id),
        supabase
          .from('splits')
          .select('id, title, created_at, created_by')
          .eq('group_id', id)
          .order('created_at', { ascending: false }),
        supabase.from('group_balances').select('*').eq('group_id', id),
        supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
          .eq('status', 'accepted'),
      ])

    const resolvedMembers = memberRows?.map((r) => r.profiles).filter(Boolean) ?? []
    setGroup(grp)
    setMembers(resolvedMembers)
    setSplits(splitRows ?? [])
    setBalances(balanceRows ?? [])

    // Resolve friend profile IDs, then fetch their names
    const friendIds = (friendshipRows ?? []).map((row) =>
      row.requester_id === user.id ? row.addressee_id : row.requester_id,
    )
    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', friendIds)
      setFriends(friendProfiles ?? [])
    } else {
      setFriends([])
    }

    setLoading(false)
  }

  const addMember = async (profileId) => {
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: id, user_id: profileId })
    if (error) {
      setInviteStatus(error.message)
    } else {
      setInviteStatus('Added!')
      fetchGroup()
      setTimeout(() => setInviteStatus(''), 2000)
    }
  }

  const searchUsers = async (query) => {
    setInviteQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', `%${query.trim()}%`)
      .neq('id', user.id)
      .limit(5)
    setSearchResults(data ?? [])
  }

  const handleSearchAdd = async (profile) => {
    setSearchResults([])
    setInviteQuery('')
    setInviteStatus('Adding…')
    await addMember(profile.id)
  }

  const memberIds = new Set(members.map((m) => m.id))
  const friendsNotInGroup = friends.filter((f) => !memberIds.has(f.id))

  const myBalance = balances.reduce((net, row) => {
    if (row.owed_id === user.id) return net + Number(row.amount)
    if (row.owes_id === user.id) return net - Number(row.amount)
    return net
  }, 0)

  if (loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-white/40 transition hover:text-white/80">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-semibold">{group?.name}</h1>
      </div>

      {/* My balance in this group */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-xs text-white/45">Your balance in this group</p>
        <p className={`mt-1 text-2xl font-semibold ${myBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {myBalance >= 0 ? '+' : ''}${Math.abs(myBalance).toFixed(2)}
        </p>
        <p className="mt-0.5 text-xs text-white/35">
          {myBalance > 0 ? "you're owed" : myBalance < 0 ? 'you owe' : 'settled up'}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Members */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Members</p>
            <button
              onClick={() => { setShowInvite((v) => !v); setInviteQuery(''); setSearchResults([]); setInviteStatus('') }}
              className="flex items-center gap-1 text-xs text-[#f5a623] hover:underline"
            >
              <UserPlus size={13} /> Add
            </button>
          </div>

          {showInvite && (
            <div className="mt-3 space-y-3">
              {/* Friend chips */}
              {friendsNotInGroup.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs text-white/40">Friends</p>
                  <div className="flex flex-wrap gap-1.5">
                    {friendsNotInGroup.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => addMember(f.id)}
                        className="rounded-full border border-[#f5a623]/40 bg-[#f5a623]/10 px-3 py-1 text-xs text-[#f7bd57] transition hover:bg-[#f5a623]/20"
                      >
                        + {f.full_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name search */}
              <div className="relative">
                <input
                  value={inviteQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Search by name…"
                  autoFocus={friendsNotInGroup.length === 0}
                  className="h-8 w-full rounded-lg border border-white/20 bg-white/[0.03] px-2.5 text-xs outline-none focus:border-[#f5a623]/70"
                />
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-9 z-10 rounded-lg border border-white/15 bg-[#1a1a1a] py-1 shadow-xl">
                    {searchResults
                      .filter((r) => !memberIds.has(r.id))
                      .map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSearchAdd(r)}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.06]"
                        >
                          {r.full_name}
                          <span className="text-[#f5a623]">Add</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {inviteStatus && <p className="mt-1.5 text-xs text-white/50">{inviteStatus}</p>}

          <ul className="mt-3 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium">
                  {m.full_name?.[0] ?? '?'}
                </div>
                <span className="text-sm">{m.full_name ?? 'Unknown'}</span>
                {m.id === user.id && <span className="text-xs text-white/35">you</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Balances between members */}
        <div className="glass-card rounded-3xl p-5">
          <p className="text-sm font-medium">Balances</p>
          {balances.length === 0 ? (
            <p className="mt-3 text-sm text-white/35">No activity yet</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {balances.map((b, i) => {
                const owes = members.find((m) => m.id === b.owes_id)
                const owed = members.find((m) => m.id === b.owed_id)
                return (
                  <li key={i} className="text-xs text-white/65">
                    <span className="font-medium text-white/90">{owes?.full_name ?? '?'}</span>
                    {' owes '}
                    <span className="font-medium text-white/90">{owed?.full_name ?? '?'}</span>
                    <span className="ml-1.5 text-emerald-400">${Number(b.amount).toFixed(2)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Splits history */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Splits</p>
          <Button
            variant="outline"
            onClick={() => {
              startGroupSplit(
                id,
                members.map((m) => ({ userId: m.id, name: m.full_name ?? '?' })),
                group?.name,
              )
              navigate('/upload')
            }}
            className="h-7 gap-1 border-[#f5a623]/50 bg-[#f5a623]/10 px-2.5 text-xs text-[#f7bd57] hover:bg-[#f5a623]/20"
          >
            <Plus size={12} /> New Split
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {splits.length === 0 ? (
            <p className="text-sm text-white/35">No splits yet</p>
          ) : (
            splits.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5"
              >
                <p className="text-sm">{s.title}</p>
                <p className="text-xs text-white/40">
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default GroupDetailPage
