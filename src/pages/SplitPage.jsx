import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const baseItems = [
  { id: 1, name: 'Truffle Fries', price: 11.5 },
  { id: 2, name: 'Spicy Tuna Roll', price: 16.0 },
  { id: 3, name: 'Still Water', price: 5.0 },
  { id: 4, name: 'Matcha Cheesecake', price: 9.75 },
]

function SplitPage() {
  const [people, setPeople] = useState(['Alex', 'Sam'])
  const [nameInput, setNameInput] = useState('')
  const [assignments, setAssignments] = useState({
    1: ['Alex'],
    2: ['Sam'],
    3: ['Alex', 'Sam'],
    4: ['Alex'],
  })

  const addPerson = () => {
    const trimmed = nameInput.trim()
    if (!trimmed || people.includes(trimmed)) return
    setPeople((prev) => [...prev, trimmed])
    setNameInput('')
  }

  const togglePersonForItem = (itemId, person) => {
    setAssignments((prev) => {
      const current = prev[itemId] || []
      const next = current.includes(person)
        ? current.filter((p) => p !== person)
        : [...current, person]
      return { ...prev, [itemId]: next }
    })
  }

  const totals = useMemo(() => {
    return people.reduce((acc, person) => {
      acc[person] = 0
      return acc
    }, {})
  }, [people])

  baseItems.forEach((item) => {
    const assigned = assignments[item.id] || []
    if (assigned.length === 0) return
    const splitAmount = item.price / assigned.length
    assigned.forEach((person) => {
      if (totals[person] !== undefined) {
        totals[person] += splitAmount
      }
    })
  })

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="glass-card rounded-3xl p-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Split the Bill</h1>
        <div className="mt-5 flex flex-wrap gap-3">
          {people.map((person) => (
            <span
              key={person}
              className="rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-sm"
            >
              {person}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Add person"
            className="h-10 flex-1 rounded-xl border border-white/20 bg-white/[0.03] px-3 text-sm outline-none transition focus:border-[#f5a623]/70"
          />
          <Button
            onClick={addPerson}
            variant="outline"
            className="h-10 border-[#f5a623]/50 bg-[#f5a623]/10 text-[#f7bd57] hover:bg-[#f5a623]/20"
          >
            Add
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <p className="text-sm text-white/65">Assign each item</p>
        <div className="mt-4 space-y-4">
          {baseItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/12 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-white/70">${item.price.toFixed(2)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {people.map((person) => {
                  const active = assignments[item.id]?.includes(person)
                  return (
                    <button
                      key={person}
                      type="button"
                      onClick={() => togglePersonForItem(item.id, person)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        active
                          ? 'border-[#f5a623]/70 bg-[#f5a623]/20 text-[#f6c065]'
                          : 'border-white/20 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]'
                      }`}
                    >
                      {person}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <p className="text-sm text-white/65">Running Totals</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {people.map((person) => (
            <div key={person} className="rounded-xl border border-white/12 px-3 py-2">
              <p className="text-sm text-white/75">{person}</p>
              <p className="mt-1 text-lg font-semibold">${totals[person].toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <Button className="gold-ring h-11 rounded-xl bg-[#f5a623] px-6 font-semibold text-black hover:bg-[#f6b03f]">
        Finalize Split
      </Button>
    </motion.section>
  )
}

export default SplitPage
