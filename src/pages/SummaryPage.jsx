import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const summaryData = [
  {
    person: 'Alex',
    items: [
      { name: 'Truffle Fries', amount: 11.5 },
      { name: 'Still Water (split)', amount: 2.5 },
      { name: 'Matcha Cheesecake', amount: 9.75 },
    ],
  },
  {
    person: 'Sam',
    items: [
      { name: 'Spicy Tuna Roll', amount: 16.0 },
      { name: 'Still Water (split)', amount: 2.5 },
    ],
  },
]

function SummaryPage() {
  const [copied, setCopied] = useState(false)

  const totals = useMemo(() => {
    return summaryData.map((entry) => ({
      ...entry,
      subtotal: entry.items.reduce((sum, item) => sum + item.amount, 0),
    }))
  }, [])

  const plainTextSummary = useMemo(() => {
    return totals
      .map((entry) => {
        const lines = entry.items
          .map((item) => `- ${item.name}: $${item.amount.toFixed(2)}`)
          .join('\n')
        return `${entry.person}\n${lines}\nSubtotal: $${entry.subtotal.toFixed(2)}`
      })
      .join('\n\n')
  }, [totals])

  const copySummary = async () => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plainTextSummary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <h1 className="text-3xl font-semibold md:text-4xl">Split Summary</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {totals.map((entry) => (
          <article key={entry.person} className="glass-card rounded-2xl p-5">
            <p className="text-xl font-semibold">{entry.person}</p>
            <ul className="mt-3 space-y-2 text-sm text-white/75">
              {entry.items.map((item) => (
                <li key={item.name} className="flex justify-between">
                  <span>{item.name}</span>
                  <span>${item.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-white/12 pt-3 text-sm font-semibold text-[#f5a623]">
              Subtotal: ${entry.subtotal.toFixed(2)}
            </p>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={copySummary}
          className="h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f]"
        >
          {copied ? 'Copied!' : 'Copy Summary'}
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-xl border-white/20 bg-white/[0.03] hover:bg-white/[0.08]"
        >
          Share
        </Button>
      </div>
    </motion.section>
  )
}

export default SummaryPage
