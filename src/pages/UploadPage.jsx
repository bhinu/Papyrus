import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useReceipt } from '@/context/useReceipt'
import { useSplitStore } from '@/store/splitStore'

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
  const [isDragging, setIsDragging] = useState(false)

  const handleUpload = async () => {
    const result = await uploadAndParse()
    if (!result) return
    if (result.is_receipt === false) return
    setItems(expandParsedItems(result.items))
    navigate('/split')
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div className="glass-card rounded-3xl p-6 md:p-8">
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

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            <p className="font-medium">{prettyErrorTitle(error.kind)}</p>
            <p className="text-red-200/80">{error.message}</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isLoading}
          className="mt-6 h-11 rounded-xl bg-[#f5a623] px-6 font-semibold text-black hover:bg-[#f6b03f] disabled:opacity-50"
        >
          {isLoading ? 'Parsing receipt…' : 'Upload Receipt'}
        </Button>
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
