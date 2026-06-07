import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useReceipt } from '@/context/useReceipt'

function toEditableItems(parseResult) {
  return (parseResult?.items || []).map((it, idx) => ({
    id: `${idx}-${it.name}`,
    name: it.name,
    quantity: it.quantity ?? 1,
    unitPrice: it.unit_price ?? 0,
  }))
}

function ParseResultPage() {
  const navigate = useNavigate()
  const { previewUrl, parseResult, setParseResult, reset } = useReceipt()

  const [seededFor, setSeededFor] = useState(null)
  const [items, setItems] = useState([])
  if (parseResult !== seededFor) {
    setSeededFor(parseResult)
    setItems(toEditableItems(parseResult))
  }

  const updateItem = useCallback(
    (id, patch) =>
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it))),
    [],
  )

  const removeItem = useCallback(
    (id) => setItems((prev) => prev.filter((it) => it.id !== id)),
    [],
  )

  const addItem = useCallback(
    () =>
      setItems((prev) => [
        ...prev,
        { id: `new-${Date.now()}`, name: '', quantity: 1, unitPrice: 0 },
      ]),
    [],
  )

  const itemsTotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(it.quantity || 0) * Number(it.unitPrice || 0),
        0,
      ),
    [items],
  )

  const continueToSplit = useCallback(() => {
    setParseResult({
      ...parseResult,
      items: items.map((it) => ({
        name: it.name,
        quantity: Number(it.quantity || 0),
        unit_price: Number(it.unitPrice || 0),
      })),
    })
    navigate('/split')
  }, [parseResult, items, setParseResult, navigate])

  if (!parseResult) {
    return (
      <EmptyState
        title="Nothing parsed yet"
        message="Upload a receipt first to see the extracted line items."
        action={
          <Button
            asChild
            className="h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f]"
          >
            <Link to="/upload">Go to upload</Link>
          </Button>
        }
      />
    )
  }

  if (parseResult.is_receipt === false) {
    return (
      <EmptyState
        tone="warn"
        title="That doesn't look like a receipt"
        message={
          parseResult.not_receipt_reason ||
          'We could not identify this image as a real purchase receipt. Try a clearer photo of an itemized receipt.'
        }
        action={
          <Button
            onClick={() => {
              reset()
              navigate('/upload')
            }}
            className="h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f]"
          >
            Try another image
          </Button>
        }
      />
    )
  }

  const hasNoItems = items.length === 0

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
          <div className="mt-4 flex h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.01]">
            {previewUrl ? (
              <img src={previewUrl} alt="Receipt" className="h-full w-full object-contain" />
            ) : (
              <p className="text-white/45">No preview available</p>
            )}
          </div>
          {parseResult.merchant && (
            <p className="mt-3 text-sm text-white/70">
              <span className="text-white/45">Merchant:</span> {parseResult.merchant}
            </p>
          )}
          {parseResult.parse_notes && (
            <p className="mt-2 text-xs text-white/55">{parseResult.parse_notes}</p>
          )}
        </div>

        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/65">Parsed Line Items</p>
            <Button
              variant="outline"
              onClick={addItem}
              className="h-8 border-white/20 bg-white/[0.03] text-white hover:bg-white/[0.08]"
            >
              + Add item
            </Button>
          </div>

          {hasNoItems ? (
            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm text-amber-100/85">
              No line items were extracted. The receipt may have been unreadable.
              You can add items manually below or upload a clearer photo.
            </div>
          ) : (
            <div className="mt-4">
              <div className="grid grid-cols-[1fr_96px_110px_28px] items-center gap-2 px-3 pb-2 text-[11px] uppercase tracking-wider text-white/40">
                <span>Item</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Price</span>
                <span />
              </div>
              <div className="space-y-2">
                {items.map((it) => (
                  <ItemRow
                    key={it.id}
                    item={it}
                    onChange={(patch) => updateItem(it.id, patch)}
                    onRemove={() => removeItem(it.id)}
                  />
                ))}
              </div>
              <p className="mt-2 px-3 text-xs text-white/45">
                Tap any field to edit. Extraction isn't perfect — fix anything that
                looks wrong.
              </p>
            </div>
          )}

          <Totals
            itemsTotal={itemsTotal}
            subtotal={parseResult.subtotal}
            tax={parseResult.tax}
            tip={parseResult.tip}
            total={parseResult.total}
          />
        </div>
      </div>

      <div className="glass-card fixed bottom-6 left-1/2 w-[min(720px,92vw)] -translate-x-1/2 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-white/65">
            {items.length} item{items.length === 1 ? '' : 's'} · $
            {itemsTotal.toFixed(2)}
          </p>
          <Button
            onClick={continueToSplit}
            disabled={items.length === 0}
            className="h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f] disabled:opacity-50"
          >
            Continue to Split
          </Button>
        </div>
      </div>
    </motion.section>
  )
}

const editableInput =
  'h-9 rounded-md border border-white/10 bg-white/[0.03] px-2 text-sm outline-none transition focus:border-[#f5a623]/60 focus:bg-white/[0.06] hover:border-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

function ItemRow({ item, onChange, onRemove }) {
  const adjustQty = (delta) => {
    const next = Math.max(0, Number(item.quantity || 0) + delta)
    onChange({ quantity: next })
  }

  return (
    <div className="grid grid-cols-[1fr_96px_110px_28px] items-center gap-2 rounded-xl border border-white/12 bg-white/[0.02] px-3 py-2">
      <input
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Item name"
        className={editableInput}
        aria-label="Item name"
      />
      <div className="flex h-9 items-stretch overflow-hidden rounded-md border border-white/10 bg-white/[0.03] transition focus-within:border-[#f5a623]/60 hover:border-white/20">
        <button
          type="button"
          onClick={() => adjustQty(-1)}
          className="w-7 text-white/55 hover:bg-white/[0.05] hover:text-white"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          min="0"
          step="1"
          value={item.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          className="w-full bg-transparent px-1 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label="Quantity"
        />
        <button
          type="button"
          onClick={() => adjustQty(1)}
          className="w-7 text-white/55 hover:bg-white/[0.05] hover:text-white"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-white/40">
          $
        </span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onChange({ unitPrice: e.target.value })}
          className={`${editableInput} w-full pl-5 text-right`}
          aria-label="Unit price"
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-lg text-white/45 transition hover:text-red-300"
        aria-label="Remove item"
      >
        ×
      </button>
    </div>
  )
}

function Totals({ itemsTotal, subtotal, tax, tip, total }) {
  const rows = [
    ['Items', itemsTotal],
    subtotal != null && ['Subtotal (from receipt)', subtotal],
    tax != null && ['Tax', tax],
    tip != null && ['Tip', tip],
    total != null && ['Total (from receipt)', total],
  ].filter(Boolean)

  return (
    <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between text-white/70">
          <span>{label}</span>
          <span>${Number(value || 0).toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ title, message, action, tone = 'neutral' }) {
  const toneClass =
    tone === 'warn'
      ? 'border-amber-400/30 bg-amber-400/5 text-amber-100'
      : 'border-white/12 bg-white/[0.02] text-white/80'
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto mt-10 max-w-2xl"
    >
      <div className={`glass-card rounded-3xl border p-8 text-center ${toneClass}`}>
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="mt-3 text-sm text-white/70">{message}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </motion.section>
  )
}

export default ParseResultPage
