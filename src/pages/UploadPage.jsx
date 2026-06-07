import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useReceipt } from '@/context/useReceipt'
import { useSplitStore } from '@/store/splitStore'
import { validateReceiptMath } from '@/lib/validateReceipt'

function expandParsedItems(parsedItems) {
  const out = []
  let nextId = 1
  for (const it of parsedItems || []) {
    const qty = Math.max(1, Math.round(Number(it.quantity) || 1))
    const price = Number(it.unit_price) || 0
    for (let i = 0; i < qty; i++) {
      out.push({ id: nextId++, name: it.name, price })
    }
  }
  return out
}

function UploadPage() {
  const navigate = useNavigate()
  const { file, previewUrl, error, isLoading, selectFile, uploadAndParse } = useReceipt()
  const setItems = useSplitStore((s) => s.setItems)
  const setCharges = useSplitStore((s) => s.setCharges)
  const groupId = useSplitStore((s) => s.groupId)
  const groupName = useSplitStore((s) => s.groupName)
  const [isDragging, setIsDragging] = useState(false)
  const [mismatch, setMismatch] = useState(null)

  if (!groupId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto mt-10 max-w-2xl"
      >
        <div className="glass-card rounded-3xl p-8 text-center">
          <h2 className="text-2xl font-semibold">No group selected</h2>
          <p className="mt-3 text-sm text-white/65">
            Start a new split from a group page so members are loaded automatically.
          </p>
          <Button
            asChild
            className="mt-6 h-10 rounded-xl bg-[#f5a623] px-5 font-semibold text-black hover:bg-[#f6b03f]"
          >
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </motion.div>
    )
  }

  // Reset mismatch warning whenever the file changes. Use the "adjust state on
  // prop change" pattern (compare in render) rather than an effect; React
  // discards this render and replays before painting, so no cascading update.
  const [seedFile, setSeedFile] = useState(file)
  if (file !== seedFile) {
    setSeedFile(file)
    setMismatch(null)
  }

  const proceedWith = (result) => {
    setItems(expandParsedItems(result.items))
    setCharges({ tax: result.tax, tip: result.tip })
    navigate('/split')
  }

  const handleUpload = async () => {
    setMismatch(null)
    const result = await uploadAndParse()
    if (!result) return
    if (result.is_receipt === false) return

    const validation = validateReceiptMath(result)
    if (!validation.skipped && !validation.ok) {
      setMismatch({ result, validation })
      return
    }
    proceedWith(result)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="glass-card rounded-3xl p-6 md:p-8">
        {groupName && (
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#f5a623]/30 bg-[#f5a623]/10 px-3 py-1 text-xs text-[#f7bd57]">
            Splitting for: <span className="font-semibold">{groupName}</span>
          </div>
        )}
        <h1 className="text-3xl font-semibold md:text-4xl">Upload Receipt</h1>
        <p className="mt-2 text-white/65">
          Drop a clear photo of your receipt. JPG, PNG, WEBP or GIF up to 10 MB.
        </p>

        <label
          htmlFor="receipt-file"
          className="mt-8 block cursor-pointer"
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            selectFile(e.dataTransfer.files?.[0])
          }}
        >
          <motion.div
            animate={{
              borderColor: isDragging
                ? 'rgba(245,166,35,0.85)'
                : 'rgba(245,166,35,0.45)',
              boxShadow: isDragging
                ? '0 0 0 1px rgba(245,166,35,0.7), 0 0 36px rgba(245,166,35,0.2)'
                : '0 0 0 1px rgba(245,166,35,0.2)',
            }}
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.22 }}
            className="rounded-2xl border-2 border-dashed bg-white/[0.02] px-6 py-14 text-center"
          >
            <p className="text-lg font-medium text-white/90">
              Drag and drop your receipt here
            </p>
            <p className="mt-2 text-sm text-white/55">or click to choose a file</p>
          </motion.div>
        </label>

        <input
          id="receipt-file"
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => selectFile(e.target.files?.[0])}
        />

        <NotReceiptBanner />

        {mismatch && (
          <MismatchBanner
            validation={mismatch.validation}
            onContinue={() => proceedWith(mismatch.result)}
            onReset={() => setMismatch(null)}
          />
        )}

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            <p className="font-medium">{prettyErrorTitle(error.kind)}</p>
            <p className="text-red-200/80">{error.message}</p>
          </div>
        )}

        {!mismatch && (
          <Button
            onClick={handleUpload}
            disabled={!file || isLoading}
            className="mt-6 h-11 rounded-xl bg-[#f5a623] px-6 font-semibold text-black hover:bg-[#f6b03f] disabled:opacity-50"
          >
            {isLoading ? 'Parsing receipt…' : 'Upload Receipt'}
          </Button>
        )}

        {isLoading && <ParsingProgress />}
      </div>

      <div className="glass-card rounded-2xl p-4">
        <p className="text-sm text-white/65">Preview</p>
        {file && previewUrl ? (
          <img
            src={previewUrl}
            alt="Uploaded receipt"
            className="mt-3 h-72 w-full rounded-xl object-contain"
          />
        ) : (
          <div className="mt-3 rounded-xl border border-white/10 p-8 text-center text-sm text-white/50">
            No file selected yet
          </div>
        )}
      </div>
    </motion.section>
  )
}

function NotReceiptBanner() {
  const { parseResult } = useReceipt()
  if (!parseResult || parseResult.is_receipt !== false) return null
  return (
    <div
      role="alert"
      className="mt-5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
    >
      <p className="font-medium">That doesn't look like a receipt</p>
      <p className="text-amber-100/80">
        {parseResult.not_receipt_reason ||
          'We could not identify this image as a real purchase receipt. Try a clearer photo of an itemized receipt.'}
      </p>
    </div>
  )
}

function MismatchBanner({ validation, onContinue, onReset }) {
  const { itemsSum, tax, tip, expected, actual, diff } = validation
  return (
    <div
      role="alert"
      className="mt-5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-4 text-sm text-amber-100"
    >
      <p className="font-medium">The numbers don't add up</p>
      <p className="mt-1 text-amber-100/80">
        The receipt's total doesn't match what we extracted. We may have missed an
        item, misread a price, or there's an unprinted fee.
      </p>

      <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-6 gap-y-0.5 rounded-lg bg-black/15 px-3 py-2 text-xs">
        <dt className="text-amber-100/70">Items subtotal</dt>
        <dd className="text-right tabular-nums">${itemsSum.toFixed(2)}</dd>
        {tax > 0 && (
          <>
            <dt className="text-amber-100/70">Tax / service</dt>
            <dd className="text-right tabular-nums">${tax.toFixed(2)}</dd>
          </>
        )}
        {tip > 0 && (
          <>
            <dt className="text-amber-100/70">Tip</dt>
            <dd className="text-right tabular-nums">${tip.toFixed(2)}</dd>
          </>
        )}
        <dt className="border-t border-amber-100/15 pt-1 text-amber-100/70">
          What we added up
        </dt>
        <dd className="border-t border-amber-100/15 pt-1 text-right tabular-nums">
          ${expected.toFixed(2)}
        </dd>
        <dt className="text-amber-100/70">Receipt total</dt>
        <dd className="text-right tabular-nums">${actual.toFixed(2)}</dd>
        <dt className="font-medium">Difference</dt>
        <dd className="text-right font-medium tabular-nums">${diff.toFixed(2)}</dd>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={onContinue}
          className="h-9 rounded-lg bg-amber-300/90 px-4 text-sm font-medium text-black hover:bg-amber-200"
        >
          Continue anyway
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          className="h-9 rounded-lg border-amber-200/40 bg-transparent text-amber-100 hover:bg-amber-100/10"
        >
          Pick another image
        </Button>
      </div>
    </div>
  )
}

const PARSING_PHASES = [
  { until: 2500, label: 'Uploading image…' },
  { until: 6000, label: 'Reading receipt…' },
  { until: Infinity, label: 'Extracting line items…' },
]

function ParsingProgress() {
  // Component mounts fresh each time isLoading flips on, so useState(0) is
  // the initial value -- no need to reset inside the effect.
  const [phaseIdx, setPhaseIdx] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - start
      const next = PARSING_PHASES.findIndex((p) => elapsed < p.until)
      setPhaseIdx(next === -1 ? PARSING_PHASES.length - 1 : next)
    }, 250)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mt-4" aria-live="polite">
      <div className="relative h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full bg-[#f5a623]"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <p className="mt-2 text-xs text-white/55">{PARSING_PHASES[phaseIdx].label}</p>
    </div>
  )
}

function prettyErrorTitle(kind) {
  switch (kind) {
    case 'unsupported_type':
      return 'Unsupported file'
    case 'file_too_large':
      return 'File too large'
    case 'missing_file':
      return 'No file selected'
    case 'network_error':
      return 'Network error'
    case 'server_misconfigured':
      return 'Server not configured'
    case 'anthropic_error':
      return 'Could not reach the parser'
    case 'model_no_tool_call':
      return 'Could not parse this image'
    default:
      return 'Something went wrong'
  }
}

export default UploadPage
