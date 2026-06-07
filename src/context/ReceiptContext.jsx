import { useCallback, useMemo, useState } from 'react'
import { ReceiptContext } from './receipt-context.js'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function ReceiptProvider({ children }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [parseResult, setParseResult] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const selectFile = useCallback((nextFile) => {
    setError(null)
    setParseResult(null)
    if (!nextFile) {
      setFile(null)
      setPreviewUrl('')
      return null
    }
    if (!ALLOWED_MIME.includes(nextFile.type)) {
      setError({
        kind: 'unsupported_type',
        message: 'Use a JPG, PNG, WEBP, or GIF image.',
      })
      return null
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError({
        kind: 'file_too_large',
        message: 'Image must be 10 MB or smaller.',
      })
      return null
    }
    setFile(nextFile)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(nextFile)
    })
    return nextFile
  }, [])

  const reset = useCallback(() => {
    setError(null)
    setParseResult(null)
    setFile(null)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
  }, [])

  const uploadAndParse = useCallback(async () => {
    if (!file) {
      setError({ kind: 'missing_file', message: 'Choose a receipt image first.' })
      return null
    }
    setIsLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('receipt', file)
      const res = await fetch('/api/parse-receipt', { method: 'POST', body: form })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError({
          kind: payload.error || 'request_failed',
          message: payload.message || `Request failed (${res.status}).`,
        })
        return null
      }
      setParseResult(payload.result)
      return payload.result
    } catch (err) {
      setError({
        kind: 'network_error',
        message: err?.message || 'Could not reach the server.',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [file])

  const value = useMemo(
    () => ({
      file,
      previewUrl,
      parseResult,
      setParseResult,
      error,
      isLoading,
      selectFile,
      uploadAndParse,
      reset,
    }),
    [file, previewUrl, parseResult, error, isLoading, selectFile, uploadAndParse, reset],
  )

  return <ReceiptContext.Provider value={value}>{children}</ReceiptContext.Provider>
}
