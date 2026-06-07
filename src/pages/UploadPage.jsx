import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

function UploadPage() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const previewUrl = useMemo(() => {
    if (!file) return ''
    if (!file.type.startsWith('image/')) return ''
    return URL.createObjectURL(file)
  }, [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const onFileChange = (nextFile) => {
    if (!nextFile) return
    setFile(nextFile)
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
        <p className="mt-2 text-white/65">Drop an image or PDF to begin parsing.</p>

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
            onFileChange(e.dataTransfer.files?.[0])
          }}
        >
          <motion.div
            animate={{
              borderColor: isDragging ? 'rgba(245,166,35,0.85)' : 'rgba(245,166,35,0.45)',
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
            <p className="mt-2 text-sm text-white/55">PNG, JPG, or PDF</p>
          </motion.div>
        </label>

        <input
          id="receipt-file"
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={(e) => onFileChange(e.target.files?.[0])}
        />

        <Button className="mt-6 h-11 rounded-xl bg-[#f5a623] px-6 font-semibold text-black hover:bg-[#f6b03f]">
          Upload Receipt
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-4">
        <p className="text-sm text-white/65">Preview</p>
        {file && previewUrl && (
          <img
            src={previewUrl}
            alt="Uploaded receipt"
            className="mt-3 h-56 w-full rounded-xl object-cover"
          />
        )}
        {file && !previewUrl && (
          <div className="mt-3 rounded-xl border border-white/10 p-4 text-sm text-white/75">
            {file.name} (PDF preview placeholder)
          </div>
        )}
        {!file && (
          <div className="mt-3 rounded-xl border border-white/10 p-8 text-center text-sm text-white/50">
            No file uploaded yet
          </div>
        )}
      </div>
    </motion.section>
  )
}

export default UploadPage
