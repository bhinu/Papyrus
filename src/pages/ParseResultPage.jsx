import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const parsedItems = [
  { id: 1, name: 'Truffle Fries', price: 11.5 },
  { id: 2, name: 'Spicy Tuna Roll', price: 16.0 },
  { id: 3, name: 'Still Water', price: 5.0 },
  { id: 4, name: 'Matcha Cheesecake', price: 9.75 },
]

function ParseResultPage() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
      className="relative mx-auto max-w-5xl pb-28"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass-card rounded-3xl p-5">
          <p className="text-sm text-white/65">Receipt Preview</p>
          <div className="mt-4 flex h-[420px] items-center justify-center rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.01]">
            <p className="text-white/45">Uploaded receipt image placeholder</p>
          </div>
        </div>
        <div className="glass-card rounded-3xl p-5">
          <p className="text-sm text-white/65">Parsed Line Items</p>
          <div className="mt-4 space-y-3">
            {parsedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/12 bg-white/[0.02] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-white/60">${item.price.toFixed(2)}</p>
                </div>
                <Button
                  variant="outline"
                  className="h-8 border-white/20 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                >
                  + Assign
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card fixed bottom-6 left-1/2 w-[min(720px,92vw)] -translate-x-1/2 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/65">Everything looks good.</p>
          <Button className="h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f]">
            Continue to Split
          </Button>
        </div>
      </div>
    </motion.section>
  )
}

export default ParseResultPage
