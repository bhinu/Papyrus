import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [balances, setBalances] = useState({ owed: 0, owing: 0 })
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchDashboard()
  }, [user])

  const fetchDashboard = async () => {
    setLoading(true)

    const { data: memberRows } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, created_at, created_by)')
      .eq('user_id', user.id)

    const groupList = memberRows?.map((r) => r.groups).filter(Boolean) ?? []

    const { data: owedRows } = await supabase
      .from('group_balances')
      .select('amount')
      .eq('owed_id', user.id)

    const { data: owingRows } = await supabase
      .from('group_balances')
      .select('amount')
      .eq('owes_id', user.id)

    const totalOwed = owedRows?.reduce((s, r) => s + Number(r.amount), 0) ?? 0
    const totalOwing = owingRows?.reduce((s, r) => s + Number(r.amount), 0) ?? 0

    setGroups(groupList)
    setBalances({ owed: totalOwed, owing: totalOwing })
    setLoading(false)
  }

  const createGroup = async (e) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setCreating(true)
    const id = crypto.randomUUID()
    const { error } = await supabase
      .from('groups')
      .insert({ id, name: newGroupName.trim(), created_by: user.id })
    setCreating(false)
    if (error) return
    setNewGroupName('')
    setShowCreate(false)
    navigate(`/groups/${id}`)
  }

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'
  const net = balances.owed - balances.owing

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold md:text-4xl">Hey, {displayName}</h1>
        <p className="mt-1 text-sm text-white/50">Here's where everything stands</p>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-white/45">You're owed</p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">${balances.owed.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-white/45">You owe</p>
          <p className="mt-1 text-xl font-semibold text-red-400">${balances.owing.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-white/45">Net</p>
          <p className={`mt-1 text-xl font-semibold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {net >= 0 ? '+' : ''}${net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Groups */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <p className="font-medium">Your Groups</p>
          <Button
            onClick={() => setShowCreate((v) => !v)}
            variant="outline"
            className="h-8 gap-1.5 border-[#f5a623]/50 bg-[#f5a623]/10 px-3 text-xs text-[#f7bd57] hover:bg-[#f5a623]/20"
          >
            <Plus size={13} /> New Group
          </Button>
        </div>

        {showCreate && (
          <form onSubmit={createGroup} className="mt-4 flex gap-2">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name…"
              autoFocus
              className="h-9 flex-1 rounded-xl border border-white/20 bg-white/[0.03] px-3 text-sm outline-none transition focus:border-[#f5a623]/70"
            />
            <Button
              type="submit"
              disabled={creating}
              className="h-9 rounded-xl bg-[#f5a623] px-4 text-sm font-semibold text-black hover:bg-[#f6b03f] disabled:opacity-50"
            >
              {creating ? '…' : 'Create'}
            </Button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-white/35">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-white/35">No groups yet — create one to get started.</p>
          ) : (
            groups.map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5a623]/15 text-[#f5a623]">
                  <Users size={15} />
                </div>
                <p className="text-sm font-medium">{g.name}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default DashboardPage
