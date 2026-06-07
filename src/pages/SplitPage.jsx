import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSplitStore } from '@/store/splitStore'
import { useReceipt } from '@/context/useReceipt'

function SplitPage() {
  const {
    items,
    people,
    assignments,
    addItem,
    updateItem,
    removeItem,
    addPerson,
    removePerson,
    toggleAssignment,
    toggleSelectAll,
    getTotals,
    isFullyAssigned,
  } = useSplitStore()
  const { parseResult } = useReceipt()
  const [nameInput, setNameInput] = useState('')
  const [copied, setCopied] = useState(false)

  const handleAdd = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    addPerson(trimmed)
    setNameInput('')
  }

  const totals = getTotals()
  const fullyAssigned = isFullyAssigned()

  const plainTextSummary = Object.entries(totals)
    .map(([person, { total, lines }]) => {
      const lineStr = lines
        .map((l) => `  - ${l.name}${l.split ? ' (split)' : ''}: $${l.amount.toFixed(2)}`)
        .join('\n')
      return `${person}\n${lineStr}\n  Total: $${total.toFixed(2)}`
    })
    .join('\n\n')

  const copyAll = async () => {
    if (!navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(plainTextSummary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto mt-10 max-w-2xl"
      >
        <div className="glass-card rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-semibold">No items yet</h2>
          <p className="mt-3 text-sm text-white/65">
            Upload a receipt to extract line items, or start a manual split.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              className="h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f]"
            >
              <Link to="/upload">Upload a receipt</Link>
            </Button>
            <Button
              onClick={() => addItem({ name: '', price: 0 })}
              variant="outline"
              className="h-10 border-white/20 bg-white/[0.03] hover:bg-white/[0.08]"
            >
              Add an item manually
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="grid gap-6 lg:grid-cols-12"
    >
      <div className="space-y-5 lg:col-span-7">
        {(parseResult?.merchant || parseResult?.parse_notes) && (
          <div className="glass-card rounded-2xl px-5 py-3 text-sm">
            {parseResult.merchant && (
              <p className="text-white/75">
                <span className="text-white/45">From:</span> {parseResult.merchant}
              </p>
            )}
            {parseResult.parse_notes && (
              <p className="mt-0.5 text-xs text-white/50">{parseResult.parse_notes}</p>
            )}
          </div>
        )}

        <div className="glass-card rounded-3xl p-6">
          <h1 className="text-2xl font-semibold md:text-3xl">Split the Bill</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {people.map((person) => (
              <span
                key={person}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.05] py-1 pl-3 pr-2 text-sm"
              >
                {person}
                <button
                  type="button"
                  onClick={() => removePerson(person)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/80"
                  aria-label={`Remove ${person}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Add a person…"
              className="h-10 flex-1 rounded-xl border border-white/20 bg-white/[0.03] px-3 text-sm outline-none transition focus:border-[#f5a623]/70"
            />
            <Button
              onClick={handleAdd}
              variant="outline"
              className="h-10 border-[#f5a623]/50 bg-[#f5a623]/10 text-[#f7bd57] hover:bg-[#f5a623]/20"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Items</p>
              <p className="text-xs text-white/45">
                Edit any name or price to fix extraction errors, then assign people below.
              </p>
            </div>
            <Button
              onClick={() => addItem({ name: '', price: 0 })}
              variant="outline"
              size="sm"
              className="h-8 border-white/20 bg-white/[0.03] text-white hover:bg-white/[0.08]"
            >
              <Plus size={14} className="mr-1" />
              Add item
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const assigned = assignments[item.id] || []
              const unassigned = assigned.length === 0
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 transition ${
                    unassigned && people.length > 0
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-white/12'
                  }`}
                >
                  <div className="grid grid-cols-[1fr_120px_24px] items-center gap-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      placeholder="Item name"
                      aria-label="Item name"
                      className="h-9 rounded-md border border-white/10 bg-white/[0.03] px-2 text-sm outline-none transition focus:border-[#f5a623]/60 focus:bg-white/[0.06] hover:border-white/20"
                    />
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-white/40">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, { price: e.target.value })}
                        aria-label="Price"
                        className="h-9 w-full rounded-md border border-white/10 bg-white/[0.03] pl-5 pr-2 text-right text-sm outline-none transition focus:border-[#f5a623]/60 focus:bg-white/[0.06] hover:border-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-red-300"
                      aria-label="Remove item"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {assigned.length > 1 && (
                    <p className="mt-2 text-xs text-white/40">
                      ${(item.price / assigned.length).toFixed(2)} each
                    </p>
                  )}

                  {people.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {people.map((person) => {
                        const active = assigned.includes(person)
                        return (
                          <button
                            key={person}
                            type="button"
                            onClick={() => toggleAssignment(item.id, person)}
                            className={`rounded-full border px-3 py-1 text-sm transition ${
                              active
                                ? 'border-[#f5a623]/70 bg-[#f5a623]/20 text-[#f6c065]'
                                : 'border-white/20 bg-white/[0.03] text-white/65 hover:bg-white/[0.08]'
                            }`}
                          >
                            {person}
                          </button>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => toggleSelectAll(item.id)}
                        className={`rounded-full border px-3 py-1 text-sm transition ${
                          assigned.length === people.length
                            ? 'border-white/30 bg-white/10 text-white/80'
                            : 'border-white/15 bg-transparent text-white/35 hover:text-white/60'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-white/35">
                      Add people above to assign this item
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="glass-card sticky top-6 rounded-3xl p-6">
          <p className="text-sm text-white/55">Summary</p>

          {people.length === 0 ? (
            <p className="mt-6 text-center text-sm text-white/30">
              Add people to see totals
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {people.map((person) => {
                const { total, lines } = totals[person]
                return (
                  <div key={person} className="rounded-2xl border border-white/10 p-4">
                    <div className="flex items-baseline justify-between">
                      <p className="font-medium">{person}</p>
                      <p className="text-lg font-semibold text-[#f5a623]">
                        ${total.toFixed(2)}
                      </p>
                    </div>
                    {lines.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {lines.map((line, i) => (
                          <li key={i} className="flex justify-between text-xs text-white/45">
                            <span>
                              {line.name}
                              {line.split && ' (split)'}
                            </span>
                            <span>${line.amount.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-5 space-y-2">
            {!fullyAssigned && people.length > 0 && (
              <p className="text-center text-xs text-red-400/80">
                Assign every item before copying
              </p>
            )}
            <Button
              onClick={copyAll}
              disabled={!fullyAssigned || people.length === 0}
              className="gold-ring h-10 w-full rounded-xl bg-[#f5a623] font-semibold text-black hover:bg-[#f6b03f] disabled:opacity-40 disabled:shadow-none"
            >
              {copied ? 'Copied!' : 'Copy Summary'}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default SplitPage
